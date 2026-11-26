package com.hub.reservehub.api.v1;

import com.hub.reservehub.domain.pass.Pass;
import com.hub.reservehub.domain.pass.PassService;
import com.hub.reservehub.domain.pass.PassType;
import com.hub.reservehub.domain.program.EnrollmentMode;
import com.hub.reservehub.domain.program.ProgramService.ProgramSpec;
import com.hub.reservehub.domain.program.ProgramType;
import com.hub.reservehub.security.CurrentAuthenticatedUser;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Validated
public class PassController {

    private final PassService passService;
    private final CurrentAuthenticatedUser currentAuthenticatedUser;

    public PassController(PassService passService, CurrentAuthenticatedUser currentAuthenticatedUser) {
        this.passService = passService;
        this.currentAuthenticatedUser = currentAuthenticatedUser;
    }

    @PostMapping("/api/v1/platforms/{platformId}/passes")
    public ResponseEntity<PassResponse> createPass(@PathVariable UUID platformId, @Valid @RequestBody CreatePassRequest request) {
        Pass pass = passService.createWithProgram(
                platformId, currentAuthenticatedUser.get(), request.name(), request.type(),
                request.price(), request.sessionCount(), request.validDays(), ProgramSpecRequest.toSpec(request.program())
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(PassResponse.from(pass));
    }

    @GetMapping("/api/v1/platforms/{platformId}/passes")
    public List<PassResponse> listPasses(@PathVariable UUID platformId) {
        return passService.list(platformId).stream().map(PassResponse::from).toList();
    }

    @GetMapping("/api/v1/passes/{id}")
    public PassResponse getPass(@PathVariable UUID id) {
        return PassResponse.from(passService.get(id));
    }

    @PatchMapping("/api/v1/passes/{id}")
    public PassResponse updatePass(@PathVariable UUID id, @Valid @RequestBody CreatePassRequest request) {
        Pass pass = passService.updateWithProgram(
                id, currentAuthenticatedUser.get(), request.name(), request.type(),
                request.price(), request.sessionCount(), request.validDays(), ProgramSpecRequest.toSpec(request.program())
        );
        return PassResponse.from(pass);
    }

    @DeleteMapping("/api/v1/passes/{id}")
    public ResponseEntity<Void> deactivatePass(@PathVariable UUID id) {
        passService.deactivate(id, currentAuthenticatedUser.get());
        return ResponseEntity.noContent().build();
    }

    public record CreatePassRequest(
            @NotBlank String name,
            @NotNull PassType type,
            @PositiveOrZero int price,
            Short sessionCount,
            @Positive short validDays,
            // 이 수강권으로 듣는 수업 설정 — 함께 보내면 같은 트랜잭션에서 저장된다(없으면 수강권만)
            @Valid ProgramSpecRequest program
    ) {
    }

    public record ProgramSpecRequest(
            @NotNull ProgramType type, EnrollmentMode enrollmentMode, @Positive short capacity, @Positive short durationMin
    ) {
        static ProgramSpec toSpec(ProgramSpecRequest r) {
            return r == null ? null : new ProgramSpec(r.type(), r.enrollmentMode(), r.capacity(), r.durationMin());
        }
    }

    public record PassResponse(
            UUID id, UUID platformId, String name, PassType type,
            int price, Short sessionCount, short validDays, boolean isActive
    ) {
        public static PassResponse from(Pass pass) {
            return new PassResponse(
                    pass.getId(), pass.getPlatformId(), pass.getName(), pass.getType(),
                    pass.getPrice(), pass.getSessionCount(), pass.getValidDays(), pass.isActive()
            );
        }
    }
}
