package com.hub.reservehub.domain.platform;

import java.math.BigDecimal;
import java.math.RoundingMode;

// ponytail: 근로소득자(EMPLOYMENT)는 국세청 간이세액표(부양가족 수 등)가 있어야 정확히 계산되므로
// 여기서는 자동계산 대상에서 제외한다(-1 반환). 표 데이터가 확보되면 EMPLOYMENT 분기를 채워 넣을 것.
public final class WithholdingTaxCalculator {

    private static final BigDecimal DAILY_DEDUCTION = BigDecimal.valueOf(150_000);

    private WithholdingTaxCalculator() {
    }

    // 소득유형별 원천징수세액(원 단위, 반올림)을 계산한다. EMPLOYMENT는 자동계산 불가(-1).
    public static int calculate(IncomeType incomeType, int grossAmount) {
        BigDecimal gross = BigDecimal.valueOf(grossAmount);
        return switch (incomeType) {
            case BUSINESS -> round(gross.multiply(BigDecimal.valueOf(0.033)));
            case OTHER -> round(gross.multiply(BigDecimal.valueOf(0.4)).multiply(BigDecimal.valueOf(0.22)));
            case DAILY -> {
                BigDecimal taxable = gross.subtract(DAILY_DEDUCTION);
                yield taxable.signum() <= 0
                        ? 0
                        : round(taxable.multiply(BigDecimal.valueOf(0.06)).multiply(BigDecimal.valueOf(0.45)));
            }
            case EMPLOYMENT -> -1;
        };
    }

    private static int round(BigDecimal amount) {
        return amount.setScale(0, RoundingMode.HALF_UP).intValueExact();
    }

    // 지급액이 없는 화면(직원 목록 등)에서 세율/산식만 안내할 때 사용.
    public static String rateLabel(IncomeType incomeType) {
        return switch (incomeType) {
            case BUSINESS -> "3.3%";
            case OTHER -> "8.8%";
            case DAILY -> "(일급-150,000원)×6%×45%";
            case EMPLOYMENT -> "간이세액표 확인 필요";
        };
    }
}
