package com.hub.reservehub.domain.platform;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

class WithholdingTaxCalculatorTest {

    @Test
    void businessIncomeIs3point3Percent() {
        assertEquals(33_000, WithholdingTaxCalculator.calculate(IncomeType.BUSINESS, 1_000_000));
    }

    @Test
    void otherIncomeIs8point8PercentOfGross() {
        assertEquals(88_000, WithholdingTaxCalculator.calculate(IncomeType.OTHER, 1_000_000));
    }

    @Test
    void dailyWorkerBelowDeductionOwesNothing() {
        assertEquals(0, WithholdingTaxCalculator.calculate(IncomeType.DAILY, 150_000));
    }

    @Test
    void dailyWorkerAboveDeductionAppliesFormula() {
        // (250,000 - 150,000) * 6% * 45% = 2,700
        assertEquals(2_700, WithholdingTaxCalculator.calculate(IncomeType.DAILY, 250_000));
    }

    @Test
    void employmentIncomeIsNotAutoCalculated() {
        assertEquals(-1, WithholdingTaxCalculator.calculate(IncomeType.EMPLOYMENT, 3_000_000));
    }
}
