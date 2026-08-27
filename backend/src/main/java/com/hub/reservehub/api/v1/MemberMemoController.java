package com.hub.reservehub.api.v1;

import com.hub.reservehub.domain.approval.MemberMemo;
import com.hub.reservehub.domain.approval.MemberMemoService;
import com.hub.reservehub.security.CurrentAuthenticatedUser;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Validated
@PreAuthorize("hasAnyRole('OWNER', 'MANAGER', 'ADMIN')")
public class MemberMemoController {

    private final MemberMemoService memberMemoService;
    private final CurrentAuthenticatedUser currentAuthenticatedUser;

    public MemberMemoController(MemberMemoService memberMemoService, CurrentAuthenticatedUser currentAuthenticatedUser) {
        this.memberMemoService = memberMemoService;
        this.currentAuthenticatedUser = currentAuthenticatedUser;
    }

    @PostMapping("/api/v1/platforms/{platformId}/members/{userId}/memos")
    public ResponseEntity<MemberMemoResponse> create(@PathVariable UUID platformId, @PathVariable UUID userId, @Valid @RequestBody CreateMemoRequest request) {
        MemberMemo memo = memberMemoService.create(platformId, currentAuthenticatedUser.get(), userId, request.content());
        return ResponseEntity.status(HttpStatus.CREATED).body(MemberMemoResponse.from(memo));
    }

    @GetMapping("/api/v1/platforms/{platformId}/members/{userId}/memos")
    public List<MemberMemoResponse> list(@PathVariable UUID platformId, @PathVariable UUID userId) {
        return memberMemoService.list(platformId, currentAuthenticatedUser.get(), userId).stream()
                .map(MemberMemoResponse::from)
                .toList();
    }

    @DeleteMapping("/api/v1/platforms/{platformId}/members/{userId}/memos/{memoId}")
    public ResponseEntity<Void> delete(@PathVariable UUID platformId, @PathVariable UUID userId, @PathVariable UUID memoId) {
        memberMemoService.delete(platformId, currentAuthenticatedUser.get(), memoId);
        return ResponseEntity.noContent().build();
    }

    public record CreateMemoRequest(@NotBlank String content) {
    }

    public record MemberMemoResponse(UUID id, UUID platformId, UUID userId, UUID authorId, String content, Instant createdAt) {
        public static MemberMemoResponse from(MemberMemo memo) {
            return new MemberMemoResponse(memo.getId(), memo.getPlatformId(), memo.getUserId(), memo.getAuthorId(), memo.getContent(), memo.getCreatedAt());
        }
    }
}
