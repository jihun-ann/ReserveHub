package com.hub.reservehub.domain.user;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.HexFormat;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 이메일/연락처 인증 — 6자리 코드를 보내고(VerificationSender), 맞게 입력하면 해당 값을 "인증됨"으로 표시한다.
 * 코드는 10분간 유효하고 5번까지만 시도할 수 있으며, 재요청은 60초 간격이다.
 */
@Service
public class ContactVerificationService {

    private static final Duration VALID_FOR = Duration.ofMinutes(10);
    private static final Duration RESEND_COOLDOWN = Duration.ofSeconds(60);
    private static final int MAX_ATTEMPTS = 5;

    private final SecureRandom random = new SecureRandom();
    private final ContactVerificationRepository verificationRepository;
    private final UserService userService;
    private final VerificationSender sender;

    public ContactVerificationService(
            ContactVerificationRepository verificationRepository, UserService userService, VerificationSender sender
    ) {
        this.verificationRepository = verificationRepository;
        this.userService = userService;
        this.sender = sender;
    }

    @Transactional
    public void request(UUID userId, VerificationChannel channel) {
        User user = userService.get(userId);
        String target = targetOf(user, channel);
        verificationRepository.findFirstByUserIdAndChannelOrderByCreatedAtDesc(userId, channel)
                .filter(v -> v.getCreatedAt().plus(RESEND_COOLDOWN).isAfter(Instant.now()))
                .ifPresent(v -> {
                    throw new IllegalStateException("잠시 후 다시 요청해 주세요. (재요청은 " + RESEND_COOLDOWN.toSeconds() + "초 간격)");
                });
        verificationRepository.deleteByUserIdAndChannel(userId, channel);
        String code = String.format("%06d", random.nextInt(1_000_000));
        verificationRepository.save(new ContactVerification(userId, channel, target, hash(userId, code), Instant.now().plus(VALID_FOR)));
        sender.send(channel, target, code);
    }

    // 틀린 시도 횟수는 예외를 던져도 저장돼야 하므로 IllegalArgumentException에서는 롤백하지 않는다.
    @Transactional(noRollbackFor = IllegalArgumentException.class)
    public User confirm(UUID userId, VerificationChannel channel, String code) {
        User user = userService.get(userId);
        ContactVerification verification = verificationRepository.findFirstByUserIdAndChannelOrderByCreatedAtDesc(userId, channel)
                .orElseThrow(() -> new IllegalArgumentException("먼저 인증 코드를 요청해 주세요."));
        if (verification.getExpiresAt().isBefore(Instant.now())) {
            throw new IllegalArgumentException("인증 코드가 만료되었습니다. 다시 요청해 주세요.");
        }
        if (verification.getAttempts() >= MAX_ATTEMPTS) {
            throw new IllegalArgumentException("시도 횟수를 초과했습니다. 인증 코드를 다시 요청해 주세요.");
        }
        verification.recordAttempt();
        boolean matches = MessageDigest.isEqual(
                hash(userId, code == null ? "" : code.trim()).getBytes(StandardCharsets.UTF_8),
                verification.getCodeHash().getBytes(StandardCharsets.UTF_8));
        if (!matches) {
            throw new IllegalArgumentException("인증 코드가 올바르지 않습니다. (남은 시도 " + (MAX_ATTEMPTS - verification.getAttempts()) + "회)");
        }
        if (!verification.getTarget().equalsIgnoreCase(targetOf(user, channel))) {
            throw new IllegalArgumentException("인증을 요청한 뒤 정보가 바뀌었습니다. 다시 요청해 주세요.");
        }
        if (channel == VerificationChannel.EMAIL) {
            user.markEmailVerified();
        } else {
            user.markPhoneVerified();
        }
        verificationRepository.deleteByUserIdAndChannel(userId, channel);
        return user;
    }

    private static String targetOf(User user, VerificationChannel channel) {
        String target = channel == VerificationChannel.EMAIL ? user.getEmail() : user.getPhone();
        if (target == null || target.isBlank()) {
            throw new IllegalStateException("인증할 " + (channel == VerificationChannel.EMAIL ? "이메일" : "연락처") + "가 등록되어 있지 않습니다.");
        }
        return target.trim();
    }

    private static String hash(UUID userId, String code) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest((userId + ":" + code).getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
