package com.hub.reservehub.domain.platform;

import com.hub.reservehub.common.exception.PlatformAccessDeniedException;
import com.hub.reservehub.domain.user.Role;
import com.hub.reservehub.domain.user.User;
import com.hub.reservehub.domain.user.UserRepository;
import com.hub.reservehub.domain.user.UserService;
import com.hub.reservehub.security.AuthenticatedUser;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * OWNER가 플랫폼에 세무사를 초대/해제하고, 세무사(또는 오너/MANAGER)가 정산용 스태프 정보를 조회하는 흐름.
 * 세무사는 PlatformStaff가 아니라 별도의 PlatformTaxAccountant 부여 — 여러 오너와 동시에 계약할 수 있는
 * 계정 전역 역할이라, 한 플랫폼에 소속되는 스태프 개념과 구조가 다르다.
 */
@Service
public class TaxAccountantService {

    private final PlatformRepository platformRepository;
    private final PlatformStaffRepository platformStaffRepository;
    private final PlatformTaxAccountantRepository platformTaxAccountantRepository;
    private final UserRepository userRepository;
    private final UserService userService;
    private final PlatformAccessGuard platformAccessGuard;

    public TaxAccountantService(
            PlatformRepository platformRepository, PlatformStaffRepository platformStaffRepository,
            PlatformTaxAccountantRepository platformTaxAccountantRepository, UserRepository userRepository,
            UserService userService, PlatformAccessGuard platformAccessGuard
    ) {
        this.platformRepository = platformRepository;
        this.platformStaffRepository = platformStaffRepository;
        this.platformTaxAccountantRepository = platformTaxAccountantRepository;
        this.userRepository = userRepository;
        this.userService = userService;
        this.platformAccessGuard = platformAccessGuard;
    }

    @Transactional
    // 이메일이 이미 세무사로 등록돼 있으면 그 계정에 이 플랫폼 접근만 추가하고, 없으면 계정을 새로 만든다.
    public User grant(
            UUID platformId, AuthenticatedUser owner, String username, String email,
            String rawPassword, String name, String phone
    ) {
        requireOwner(platformId, owner);
        User accountant = userService.findOrCreateWithRole(username, email, rawPassword, Role.TAX_ACCOUNTANT, name, phone);

        platformTaxAccountantRepository.findByPlatformIdAndUserId(platformId, accountant.getId())
                .ifPresentOrElse(
                        PlatformTaxAccountant::rejoin,
                        () -> platformTaxAccountantRepository.save(new PlatformTaxAccountant(platformId, accountant.getId()))
                );
        return accountant;
    }

    @Transactional
    public void revoke(UUID platformId, AuthenticatedUser owner, UUID accountantUserId) {
        requireOwner(platformId, owner);
        PlatformTaxAccountant grant = platformTaxAccountantRepository.findByPlatformIdAndUserId(platformId, accountantUserId)
                .orElseThrow(() -> new IllegalArgumentException("Tax accountant grant not found"));
        grant.leave();
    }

    @Transactional(readOnly = true)
    public List<GrantedAccountant> listGranted(UUID platformId, AuthenticatedUser owner) {
        requireOwner(platformId, owner);
        List<PlatformTaxAccountant> grants = platformTaxAccountantRepository.findByPlatformIdAndIsActiveTrue(platformId);
        Map<UUID, User> usersById = userRepository.findAllById(grants.stream().map(PlatformTaxAccountant::getUserId).toList())
                .stream().collect(Collectors.toMap(User::getId, Function.identity()));
        return grants.stream()
                .map(grant -> usersById.get(grant.getUserId()))
                .filter(java.util.Objects::nonNull)
                .map(user -> new GrantedAccountant(user, grants.stream()
                        .filter(g -> g.getUserId().equals(user.getId())).findFirst().map(PlatformTaxAccountant::getIncomeType).orElse(null)))
                .toList();
    }

    public record GrantedAccountant(User user, @Nullable IncomeType incomeType) {
    }

    @Transactional
    // 세무사 본인의 소득 구분(보통 사업소득자) 지정 — OWNER만 변경 가능.
    public PlatformTaxAccountant updateIncomeType(UUID platformId, AuthenticatedUser owner, UUID accountantUserId, IncomeType incomeType) {
        requireOwner(platformId, owner);
        PlatformTaxAccountant grant = platformTaxAccountantRepository.findByPlatformIdAndUserId(platformId, accountantUserId)
                .orElseThrow(() -> new IllegalArgumentException("Tax accountant grant not found"));
        grant.changeIncomeType(incomeType);
        return grant;
    }

    @Transactional(readOnly = true)
    // 오너/MANAGER/초대된 세무사만 — 오너 본인과 이 플랫폼에 부여된 세무사까지 포함해 이 플랫폼과
    // 관계된 사람 전원의 개인정보와 정산 계좌를 묶어 보여준다 ("직원 정보"에 세무사도 포함되어야 한다).
    public List<StaffPayrollEntry> listStaffPayroll(UUID platformId, AuthenticatedUser actor) {
        platformAccessGuard.verifyFinancialAccess(platformId, actor);
        Platform platform = platformRepository.findById(platformId)
                .orElseThrow(() -> new IllegalArgumentException("Platform not found"));
        List<PlatformStaff> staffList = platformStaffRepository.findByPlatformIdAndIsActiveTrue(platformId);
        List<PlatformTaxAccountant> accountantGrants = platformTaxAccountantRepository.findByPlatformIdAndIsActiveTrue(platformId);

        List<UUID> userIds = new ArrayList<>(staffList.stream().map(PlatformStaff::getUserId).distinct().toList());
        userIds.addAll(accountantGrants.stream().map(PlatformTaxAccountant::getUserId).distinct().toList());
        userIds.add(platform.getCreatedBy());
        Map<UUID, User> usersById = userRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));

        List<StaffPayrollEntry> entries = new ArrayList<>();
        User owner = usersById.get(platform.getCreatedBy());
        if (owner != null) {
            entries.add(toPayrollEntry(owner, "OWNER", null));
        }
        staffList.forEach(staff -> {
            User user = usersById.get(staff.getUserId());
            if (user != null) {
                entries.add(toPayrollEntry(user, staff.getStaffRole().name(), staff.getIncomeType()));
            }
        });
        accountantGrants.forEach(grant -> {
            User user = usersById.get(grant.getUserId());
            if (user != null) {
                entries.add(toPayrollEntry(user, "TAX_ACCOUNTANT", grant.getIncomeType()));
            }
        });
        return entries;
    }

    private StaffPayrollEntry toPayrollEntry(User user, String role, @Nullable IncomeType incomeType) {
        return new StaffPayrollEntry(
                user.getId(), user.getName(), user.getEmail(), user.getPhone(), role,
                user.getBankName(), user.getBankAccountNumber(), user.getBankAccountHolder(),
                incomeType, incomeType != null ? WithholdingTaxCalculator.rateLabel(incomeType) : null
        );
    }

    private void requireOwner(UUID platformId, AuthenticatedUser owner) {
        if (!platformRepository.existsByIdAndCreatedBy(platformId, owner.getId())) {
            throw new PlatformAccessDeniedException(platformId);
        }
    }

    public record StaffPayrollEntry(
            UUID userId, String name, String email, String phone, String role,
            String bankName, String bankAccountNumber, String bankAccountHolder,
            @Nullable IncomeType incomeType, @Nullable String withholdingRateLabel
    ) {
    }
}
