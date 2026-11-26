package com.hub.reservehub.domain.approval;

import com.hub.reservehub.common.persistence.Lookups;
import com.hub.reservehub.common.storage.UploadedFiles;
import com.hub.reservehub.domain.user.User;
import com.hub.reservehub.domain.user.UserRepository;
import com.hub.reservehub.security.AuthenticatedUser;
import java.nio.file.Path;
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
        Path target = UploadedFiles.store(uploadsRoot.resolve(requestId.toString()), file);
        return WorkRequestComment.withAttachment(
                requestId, authorId, content, file.getOriginalFilename(), target.toString(), file.getContentType(), file.getSize()
        );
    }

    static boolean hasUsableContent(@Nullable String content, @Nullable MultipartFile file) {
        boolean hasContent = content != null && !content.isBlank();
        boolean hasFile = file != null && !file.isEmpty();
        return hasContent || hasFile;
    }
}

