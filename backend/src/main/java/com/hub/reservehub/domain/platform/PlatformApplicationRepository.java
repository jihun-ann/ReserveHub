package com.hub.reservehub.domain.platform;

import com.hub.reservehub.common.persistence.BaseRepository;
import java.util.List;
import java.util.UUID;

public interface PlatformApplicationRepository extends BaseRepository<PlatformApplication, UUID> {
    List<PlatformApplication> findByApplicantIdOrderByCreatedAtDesc(UUID applicantId);

    // ponytail: 상태별 전체 목록 — 신청이 수천 건 쌓이면 페이지네이션 추가.
    List<PlatformApplication> findByStatusOrderByCreatedAtAsc(PlatformApplicationStatus status);

    boolean existsByBusinessNumberAndStatus(String businessNumber, PlatformApplicationStatus status);
}
