package com.hub.reservehub.domain.approval;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WorkRequestCommentRepository extends JpaRepository<WorkRequestComment, UUID> {
    List<WorkRequestComment> findByRequestIdOrderByCreatedAtAsc(UUID requestId);
}
