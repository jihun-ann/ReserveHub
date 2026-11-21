package com.hub.reservehub.api.v1;

import com.hub.reservehub.domain.approval.WorkRequestComment;
import com.hub.reservehub.domain.approval.WorkRequestCommentService;
import com.hub.reservehub.domain.approval.WorkRequestCommentService.CommentView;
import com.hub.reservehub.domain.user.Role;
import com.hub.reservehub.security.CurrentAuthenticatedUser;
import java.io.IOException;
import java.nio.file.Files;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.InvalidMediaTypeException;
import org.springframework.lang.Nullable;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@Validated
@PreAuthorize("hasAnyRole('OWNER', 'MANAGER', 'TUTOR', 'TAX_ACCOUNTANT')")
public class WorkRequestCommentController {

    private final WorkRequestCommentService commentService;
    private final CurrentAuthenticatedUser currentAuthenticatedUser;

    public WorkRequestCommentController(WorkRequestCommentService commentService, CurrentAuthenticatedUser currentAuthenticatedUser) {
        this.commentService = commentService;
        this.currentAuthenticatedUser = currentAuthenticatedUser;
    }

    @PostMapping("/api/v1/work-requests/{id}/comments")
    public ResponseEntity<CommentResponse> create(
            @PathVariable UUID id,
            @RequestParam(required = false) String content,
            @RequestParam(required = false) MultipartFile file
    ) {
        CommentView created = commentService.create(id, currentAuthenticatedUser.get(), content, file);
        return ResponseEntity.status(HttpStatus.CREATED).body(CommentResponse.from(created));
    }

    @GetMapping("/api/v1/work-requests/{id}/comments")
    public List<CommentResponse> list(@PathVariable UUID id) {
        return commentService.list(id, currentAuthenticatedUser.get()).stream()
                .map(CommentResponse::from)
                .toList();
    }

    @GetMapping("/api/v1/work-requests/{id}/comments/{commentId}/attachment")
    public ResponseEntity<Resource> downloadAttachment(@PathVariable UUID id, @PathVariable UUID commentId) throws IOException {
        WorkRequestComment comment = commentService.getAttachment(id, commentId, currentAuthenticatedUser.get());
        Resource resource = new FileSystemResource(comment.getAttachmentStoredPath());
        return ResponseEntity.ok()
                .contentType(safeContentType(comment.getAttachmentContentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment().filename(comment.getAttachmentOriginalName(), java.nio.charset.StandardCharsets.UTF_8).build().toString())
                .contentLength(Files.size(resource.getFile().toPath()))
                .body(resource);
    }

    // 브라우저에서 열어도 스크립트가 돌지 않는 타입만 그대로 내려준다.
    private static final Set<String> INLINE_SAFE_TYPES = Set.of(
            "image/png", "image/jpeg", "image/gif", "image/webp", "application/pdf", "text/plain"
    );

    // 첨부의 Content-Type은 업로더가 보낸 값이다. text/html이나 image/svg+xml을 그대로 돌려주면 프론트가 이 응답을
    // 앱과 같은 오리진의 blob URL로 열 때 스크립트가 실행된다(저장형 XSS). 허용 목록 밖은 전부 바이너리로 내려 다운로드되게 한다.
    static MediaType safeContentType(@Nullable String stored) {
        if (stored != null) {
            try {
                MediaType type = MediaType.parseMediaType(stored);
                String base = type.getType() + "/" + type.getSubtype();
                if (INLINE_SAFE_TYPES.contains(base.toLowerCase(Locale.ROOT))) {
                    return MediaType.parseMediaType(base); // charset 등 파라미터는 버린다
                }
            } catch (InvalidMediaTypeException ignored) {
                // 깨진 값은 바이너리로 취급
            }
        }
        return MediaType.APPLICATION_OCTET_STREAM;
    }

    public record CommentResponse(
            UUID id, UUID authorId, String authorName, Role authorRole, String content,
            String attachmentName, Long attachmentSizeBytes, Instant createdAt
    ) {
        public static CommentResponse from(CommentView view) {
            WorkRequestComment comment = view.comment();
            var author = view.author();
            return new CommentResponse(
                    comment.getId(), comment.getAuthorId(), author != null ? author.getName() : "알 수 없음",
                    author != null ? author.getRole() : null, comment.getContent(),
                    comment.getAttachmentOriginalName(), comment.getAttachmentSizeBytes(), comment.getCreatedAt()
            );
        }
    }
}
