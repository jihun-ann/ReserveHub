package com.hub.reservehub.domain.platform;

// 강사/직원/세무사의 소득 구분 — 원천징수 계산 방식이 서로 다르다.
public enum IncomeType {
    EMPLOYMENT, // 근로소득자 (정규 급여, 간이세액표 기준)
    BUSINESS,   // 사업소득자 (3.3% 원천징수)
    OTHER,      // 기타소득자 (필요경비 60% 공제 후 22%)
    DAILY       // 일용근로자
}
