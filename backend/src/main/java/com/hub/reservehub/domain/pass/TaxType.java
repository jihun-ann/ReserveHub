package com.hub.reservehub.domain.pass;

// 세액 포함/미포함 집계용 — 항목별 실제 과세/면세 구분.
public enum TaxType {
    TAXABLE, // 과세 (부가세 포함 금액, 미포함 표시 시 1.1로 나눔)
    EXEMPT   // 면세 (통상 학원 교습비)
}
