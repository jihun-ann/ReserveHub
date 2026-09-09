package com.hub.reservehub.api.v1;

import com.hub.reservehub.domain.program.ProgramService;
import com.hub.reservehub.domain.program.SlotMember;
import com.hub.reservehub.security.CurrentAuthenticatedUser;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

/**
 * 고정형(PRIVATE, 또는 GROUP+FIXED) 슬롯의 고정 로스터 관리 — 매니저가 학생을 미리 등록해두면 매주 신청 없이
 * Lesson 생성 시 Reservation이 자동으로 잡힌다 (LessonService.create 참고).
 */
@RestController
@Validated
public class SlotMemberController {

    private final ProgramService programService;
    private final CurrentAuthenticatedUser currentAuthenticatedUser;

    public SlotMemberController(ProgramService programService, CurrentAuthenticatedUser currentAuthenticatedUser) {
        this.programService = programService;
        this.currentAuthenticatedUser = currentAuthenticatedUser;
    }

    @PostMapping("/api/v1/programs/{programId}/slots/{slotId}/members")
    public ResponseEntity<SlotMemberResponse> addMember(
            @PathVariable UUID programId, @PathVariable UUID slotId, @Valid @RequestBody AddSlotMemberRequest request
    ) {
        SlotMember member = programService.addSlotMember(programId, slotId, currentAuthenticatedUser.get(), request.userId(), request.userPassId());
        return ResponseEntity.status(HttpStatus.CREATED).body(SlotMemberResponse.from(member));
    }

    @GetMapping("/api/v1/programs/{programId}/slots/{slotId}/members")
    public List<SlotMemberResponse> listMembers(@PathVariable UUID programId, @PathVariable UUID slotId) {
        return programService.listSlotMembers(programId, slotId).stream()
                .map(SlotMemberResponse::from)
                .toList();
    }

    @DeleteMapping("/api/v1/programs/{programId}/slots/{slotId}/members/{memberId}")
    public ResponseEntity<Void> removeMember(@PathVariable UUID programId, @PathVariable UUID slotId, @PathVariable UUID memberId) {
        programService.removeSlotMember(programId, slotId, memberId, currentAuthenticatedUser.get());
        return ResponseEntity.noContent().build();
    }

    public record AddSlotMemberRequest(@NotNull UUID userId, @NotNull UUID userPassId) {
    }

    public record SlotMemberResponse(UUID id, UUID slotId, UUID userId, UUID userPassId) {
        public static SlotMemberResponse from(SlotMember member) {
            return new SlotMemberResponse(member.getId(), member.getSlotId(), member.getUserId(), member.getUserPassId());
        }
    }
}
