package com.hub.reservehub.api.v1;

import com.hub.reservehub.domain.approval.FinancialRequestComment;
import com.hub.reservehub.domain.approval.FinancialRequestCommentService;
import com.hub.reservehub.domain.approval.FinancialRequestCommentService.CommentView;
import com.hub.reservehub.domain.user.Role;
import com.hub.reservehub.security.CurrentAuthenticatedUser;
import java.io.IOException;
import java.nio.file.Files;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.core.io.FileSystemResource;
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
@PreAuthorize("hasAnyRole('OWNER', 'MANAGER', 'TAX_ACCOUNTANT')")
public class FinancialRequestCommentController {

    private final FinancialRequestCommentService commentService;
    private final CurrentAuthenticatedUser currentAuthenticatedUser;

    public FinancialRequestCommentController(FinancialRequestCommentService commentService, CurrentAuthenticatedUser currentAuthenticatedUser) {
        this.commentService = commentService;
        this.currentAuthenticatedUser = currentAuthenticatedUser;
    }

    @PostMapping("/api/v1/financial-requests/{id}/comments")
    public ResponseEntity<CommentResponse> create(
            @PathVariable UUID id,
            @RequestParam(required = false) String content,
            @RequestParam(required = false) MultipartFile file
    ) {
        CommentView created = commentService.create(id, currentAuthenticatedUser.get(), content, file);
        return ResponseEntity.status(HttpStatus.CREATED).body(CommentResponse.from(created));
    }

    @GetMapping("/api/v1/financial-requests/{id}/comments")
    public List<CommentResponse> list(@PathVariable UUID id) {
        return commentService.list(id, currentAuthenticatedUser.get()).stream()
                .map(CommentResponse::from)
                .toList();
    }

    @GetMapping("/api/v1/financial-requests/{id}/comments/{commentId}/attachment")
    public ResponseEntity<Resource> downloadAttachment(@PathVariable UUID id, @PathVariable UUID commentId) throws IOException {
        FinancialRequestComment comment = commentService.getAttachment(id, commentId, currentAuthenticatedUser.get());
        Resource resource = new FileSystemResource(comment.getAttachmentStoredPath());
        String contentType = comment.getAttachmentContentType() != null ? comment.getAttachmentContentType() : MediaType.APPLICATION_OCTET_STREAM_VALUE;
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment().filename(comment.getAttachmentOriginalName(), java.nio.charset.StandardCharsets.UTF_8).build().toString())
                .contentLength(Files.size(resource.getFile().toPath()))
                .body(resource);
    }

    public record CommentResponse(
            UUID id, UUID authorId, String authorName, Role authorRole, String content,
            String attachmentName, Long attachmentSizeBytes, Instant createdAt
    ) {
        public static CommentResponse from(CommentView view) {
            FinancialRequestComment comment = view.comment();
            var author = view.author();
            return new CommentResponse(
                    comment.getId(), comment.getAuthorId(), author != null ? author.getName() : "알 수 없음",
                    author != null ? author.getRole() : null, comment.getContent(),
                    comment.getAttachmentOriginalName(), comment.getAttachmentSizeBytes(), comment.getCreatedAt()
            );
        }
    }
}
