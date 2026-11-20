package com.hub.reservehub.domain.approval;

public enum WorkRequestStatus {
    REQUESTED,   // 요청됨
    IN_PROGRESS, // 진행 중 — 담당자가 시작
    DONE,        // 완료 — 담당자가 끝냄
    CANCELED,    // 취소 — 요청자가 거둠
    REVISION_REQUESTED // 추가 확인 요청 — 요청자가 완료된 일을 다시 돌려보냄
}
