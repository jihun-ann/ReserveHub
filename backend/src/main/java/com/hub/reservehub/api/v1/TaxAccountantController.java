package com.hub.reservehub.api.v1;

import com.hub.reservehub.domain.platform.TaxAccountantService;
import com.hub.reservehub.domain.user.User;
import com.hub.reservehub.security.AuthenticatedUser;
import com.hub.reservehub.security.CurrentAuthenticatedUser;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
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
public class TaxAccountantController {

    private final TaxAccountantService taxAccountantService;
    private final CurrentAuthenticatedUser currentAuthenticatedUser;

    public TaxAccountantController(TaxAccountantService taxAccountantService, CurrentAuthenticatedUser currentAuthenticatedUser) {
        this.taxAccountantService = taxAccountantService;
        this.currentAuthenticatedUser = currentAuthenticatedUser;
    }

    @PostMapping("/api/v1/platforms/{platformId}/tax-accountants")
    @PreAuthorize("hasRole('OWNER')")
    // 이메일이 이미 세무사로 등록돼 있으면 이 플랫폼 접근만 추가하고, 없으면 계정을 새로 만들어 초대한다.
    public ResponseEntity<UserSummary> grant(@PathVariable UUID platformId, @Valid @RequestBody GrantRequest request) {
        AuthenticatedUser owner = currentAuthenticatedUser.get();
        User accountant = taxAccountantService.grant(
                platformId, owner, request.username(), request.email(), request.password(), request.name(), request.phone()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(UserSummary.from(accountant));
    }

    @DeleteMapping("/api/v1/platforms/{platformId}/tax-accountants/{userId}")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<Void> revoke(@PathVariable UUID platformId, @PathVariable UUID userId) {
        taxAccountantService.revoke(platformId, currentAuthenticatedUser.get(), userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/api/v1/platforms/{platformId}/tax-accountants")
    @PreAuthorize("hasRole('OWNER')")
    public List<UserSummary> list(@PathVariable UUID platformId) {
        return taxAccountantService.listGranted(platformId, currentAuthenticatedUser.get()).stream()
                .map(UserSummary::from)
                .toList();
    }

    @GetMapping("/api/v1/platforms/{platformId}/staff-payroll")
    // 오너/MANAGER/세무사만 접근 가능 — 실제 검증은 서비스의 verifyFinancialAccess에서 처리한다.
    public List<StaffPayrollResponse> staffPayroll(@PathVariable UUID platformId) {
        return taxAccountantService.listStaffPayroll(platformId, currentAuthenticatedUser.get()).stream()
                .map(StaffPayrollResponse::from)
                .toList();
    }

    public record GrantRequest(
            @NotBlank @Pattern(regexp = "^[a-zA-Z0-9_]{4,20}$", message = "아이디는 영문/숫자/밑줄 4~20자여야 합니다") String username,
            @Email @NotBlank String email,
            @NotBlank String password,
            @NotBlank String name,
            String phone
    ) {
    }

    public record UserSummary(UUID id, String username, String email, String name, String phone) {
        public static UserSummary from(User user) {
            return new UserSummary(user.getId(), user.getUsername(), user.getEmail(), user.getName(), user.getPhone());
        }
    }

    public record StaffPayrollResponse(
            UUID userId, String name, String email, String phone, String role,
            String bankName, String bankAccountNumber, String bankAccountHolder
    ) {
        public static StaffPayrollResponse from(TaxAccountantService.StaffPayrollEntry entry) {
            return new StaffPayrollResponse(
                    entry.userId(), entry.name(), entry.email(), entry.phone(), entry.role(),
                    entry.bankName(), entry.bankAccountNumber(), entry.bankAccountHolder()
            );
        }
    }
}
