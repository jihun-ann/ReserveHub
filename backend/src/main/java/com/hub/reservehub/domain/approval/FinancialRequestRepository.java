package com.hub.reservehub.domain.approval;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FinancialRequestRepository extends JpaRepository<FinancialRequest, UUID> {
    List<FinancialRequest> findByPlatformId(UUID platformId);

    List<FinancialRequest> findByRequestedBy(UUID requestedBy);
}
