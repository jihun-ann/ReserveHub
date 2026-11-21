package com.hub.reservehub.domain.approval;

import com.hub.reservehub.common.persistence.Lookups;
import com.hub.reservehub.domain.user.User;
import com.hub.reservehub.domain.user.UserRepository;
import com.hub.reservehub.security.AuthenticatedUser;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

/**
 * 업무 요청 댓글 — 오너·매니저·세무사가 자유롭게 이어서 남기고 파일을 첨부할 수 있다.
 * 접근 권한은 WorkRequestService.findViewable로 검증한다
 * (오너·매니저·세무사, 또는 이 요청의 담당자).
 */
@Service
public class WorkRequestCommentService {

    private final WorkRequestCommentRepository commentRepository;
    private final WorkRequestService workRequestService;
    private final ActionLogger actionLogger;
    private final UserRepository userRepository;
    private final Path uploadsRoot;

    public WorkRequestCommentService(
            WorkRequestCommentRepository commentRepository, WorkRequestService workRequestService,
            ActionLogger actionLogger, UserRepository userRepository,
            @Value("${app.uploads.dir:uploads}") String uploadsDir
    ) {
        this.commentRepository = commentRepository;
        this.workRequestService = workRequestService;
        this.actionLogger = actionLogger;
        this.userRepository = userRepository;
        this.uploadsRoot = Path.of(uploadsDir, "work-requests");
    }

    @Transactional
    public CommentView create(UUID requestId, AuthenticatedUser actor, @Nullable String content, @Nullable MultipartFile file) {
        WorkRequest request = workRequestService.findViewable(requestId, actor);
        if (!hasUsableContent(content, file)) {
            throw new IllegalArgumentException("Comment must have content or an attachment");
        }

        WorkRequestComment comment = (file != null && !file.isEmpty())
                ? saveWithAttachment(requestId, actor.getId(), content, file)
                : new WorkRequestComment(requestId, actor.getId(), content);
        comment = commentRepository.save(comment);

        actionLogger.log(request.getPlatformId(), actor.getId(), ActionTarget.FINANCIAL_REQUEST, requestId, "COMMENT",
                "업무 요청 '" + request.getTitle() + "'에 댓글 작성" + (file != null && !file.isEmpty() ? " (첨부파일 포함)" : "")
                        + (content == null || content.isBlank() ? "" : ": \"" + LogMemo.clip(content, 80) + "\""));
        User author = userRepository.findById(actor.getId())
                .orElseThrow(() -> new IllegalStateException("Authenticated user not found: " + actor.getId()));
        return new CommentView(comment, author);
    }

    @Transactional(readOnly = true)
    public List<CommentView> list(UUID requestId, AuthenticatedUser actor) {
        workRequestService.findViewable(requestId, actor);
        List<WorkRequestComment> comments = commentRepository.findByRequestIdOrderByCreatedAtAsc(requestId);
        Map<UUID, User> usersById = Lookups.byId(userRepository.findAllById(comments.stream().map(WorkRequestComment::getAuthorId).distinct().toList()), User::getId);
        return comments.stream()
                .map(comment -> new CommentView(comment, usersById.get(comment.getAuthorId())))
                .toList();
    }

    public record CommentView(WorkRequestComment comment, @Nullable User author) {
    }

    @Transactional(readOnly = true)
    public WorkRequestComment getAttachment(UUID requestId, UUID commentId, AuthenticatedUser actor) {
        workRequestService.findViewable(requestId, actor);
        WorkRequestComment comment = commentRepository.getOrThrow(commentId);
        if (!comment.getRequestId().equals(requestId) || comment.getAttachmentStoredPath() == null) {
            throw new IllegalArgumentException("Attachment not found");
        }
        return comment;
    }

    private WorkRequestComment saveWithAttachment(UUID requestId, UUID authorId, @Nullable String content, MultipartFile file) {
        try {
            Path dir = uploadsRoot.resolve(requestId.toString());
            Files.createDirectories(dir);
            String storedName = UUID.randomUUID() + "_" + sanitizeFilename(file.getOriginalFilename());
            Path target = dir.resolve(storedName);
            file.transferTo(target);
            deleteOnRollback(target);
            return WorkRequestComment.withAttachment(
                    requestId, authorId, content, file.getOriginalFilename(), target.toString(), file.getContentType(), file.getSize()
            );
        } catch (IOException e) {
            throw new UncheckedIOException("Failed to store attachment", e);
        }
    }

    // 파일은 DB 커밋 전에 디스크에 써지므로, 댓글 저장이 롤백되면 주인 없는 파일이 남는다 — 롤백 시 지운다.
    private static void deleteOnRollback(Path file) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCompletion(int status) {
                if (status != STATUS_COMMITTED) {
                    try {
                        Files.deleteIfExists(file);
                    } catch (IOException ignored) {
                        // 정리 실패는 요청 결과를 바꾸지 않는다 — 파일 하나가 남을 뿐이다.
                    }
                }
            }
        });
    }

    // ponytail: 특수문자를 지워 경로 조작(../, 널바이트 등)을 막는 최소한의 검증. 확장자별 화이트리스트나
    // 바이러스 스캔은 아직 없음 — 실제 첨부 사용량이 늘면 추가.
    private static String sanitizeFilename(@Nullable String originalName) {
        if (originalName == null || originalName.isBlank()) {
            return "file";
        }
        String base = Path.of(originalName).getFileName().toString();
        return base.replaceAll("[^A-Za-z0-9._-]", "_");
    }

    static boolean hasUsableContent(@Nullable String content, @Nullable MultipartFile file) {
        boolean hasContent = content != null && !content.isBlank();
        boolean hasFile = file != null && !file.isEmpty();
        return hasContent || hasFile;
    }
}

