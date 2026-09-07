package com.hub.reservehub.api.v1;

import com.hub.reservehub.domain.pass.MemberService;
import com.hub.reservehub.domain.pass.UserPassStatus;
import com.hub.reservehub.domain.user.User;
import com.hub.reservehub.security.CurrentAuthenticatedUser;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
// MemberService.list already scopes access via platformAccessGuard (owner or any active staff,
// including TUTOR) — this just needs to admit tutors past the door.
// MemberService.list이 platformAccessGuard로 접근 범위를 이미 검증한다(오너 또는 TUTOR/강사 포함 활성 스태프
// 누구나) — 여기서는 강사가 그 검증까지 도달하도록 막지만 않으면 된다.
@PreAuthorize("hasAnyRole('OWNER', 'MANAGER', 'TUTOR')")
public class MemberController {

    private final MemberService memberService;
    private final CurrentAuthenticatedUser currentAuthenticatedUser;

    public MemberController(MemberService memberService, CurrentAuthenticatedUser currentAuthenticatedUser) {
        this.memberService = memberService;
        this.currentAuthenticatedUser = currentAuthenticatedUser;
    }

    @GetMapping("/api/v1/platforms/{platformId}/members")
    public List<MemberResponse> list(@PathVariable UUID platformId) {
        return memberService.list(platformId, currentAuthenticatedUser.get()).stream()
                .map(MemberResponse::from)
                .toList();
    }

    @PatchMapping("/api/v1/platforms/{platformId}/members/{userId}/guardian")
    public GuardianResponse updateGuardian(
            @PathVariable UUID platformId, @PathVariable UUID userId, @Valid @RequestBody UpdateGuardianRequest request
    ) {
        User user = memberService.updateGuardian(
                platformId, currentAuthenticatedUser.get(), userId, request.guardianName(), request.guardianPhone()
        );
        return new GuardianResponse(user.getId(), user.getGuardianName(), user.getGuardianPhone());
    }

    public record UpdateGuardianRequest(String guardianName, String guardianPhone) {
    }

    public record GuardianResponse(UUID userId, String guardianName, String guardianPhone) {
    }

    public record MemberResponse(
            UUID userId, String email, String name, String phone, String guardianName, String guardianPhone,
            UUID userPassId, String passName, Integer sessionsTotal,
            int sessionsUsed, UserPassStatus status, LocalDate startedAt, LocalDate expiresAt
    ) {
        static MemberResponse from(MemberService.MemberPass mp) {
            return new MemberResponse(
                    mp.user().getId(), mp.user().getEmail(), mp.user().getName(), mp.user().getPhone(),
                    mp.user().getGuardianName(), mp.user().getGuardianPhone(),
                    mp.userPass().getId(), mp.pass().getName(), mp.userPass().getSessionsTotal(),
                    mp.userPass().getSessionsUsed(), mp.userPass().getStatus(),
                    mp.userPass().getStartedAt(), mp.userPass().getExpiresAt()
            );
        }
    }
}
