package com.hub.reservehub.domain.approval;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FinancialRequestCommentRepository extends JpaRepository<FinancialRequestComment, UUID> {
    List<FinancialRequestComment> findByRequestIdOrderByCreatedAtAsc(UUID requestId);
}
