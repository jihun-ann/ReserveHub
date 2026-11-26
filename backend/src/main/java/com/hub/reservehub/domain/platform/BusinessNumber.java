package com.hub.reservehub.domain.platform;

import org.springframework.lang.Nullable;

/**
 * Korean business registration number (사업자등록번호) — strips separators and verifies the check digit.
 * 사업자등록번호 — 하이픈/공백을 지우고 검증번호(마지막 자리)를 확인한다. 오타를 걸러내는 용도이며,
 * 실제 사업자인지는 관리자가 등록증을 보고 판단한다.
 */
public final class BusinessNumber {

    private static final int[] WEIGHTS = {1, 3, 7, 1, 3, 7, 1, 3, 5};

    private BusinessNumber() {
    }

    // 숫자 10자리로 정리해 반환하고, 형식이나 검증번호가 틀리면 예외를 던진다.
    public static String normalize(@Nullable String raw) {
        String digits = raw == null ? "" : raw.replaceAll("[\\s-]", "");
        if (!digits.matches("[0-9]{10}") || !hasValidCheckDigit(digits)) {
            throw new IllegalArgumentException("사업자등록번호가 올바르지 않습니다.");
        }
        return digits;
    }

    // 국세청 공개 규칙: 앞 9자리에 가중치(1,3,7,1,3,7,1,3,5)를 곱해 더하고, 9번째 자리×5의 십의 자리를 한 번 더 더한다.
    // (10 - 합 % 10) % 10 이 마지막 자리와 같아야 한다.
    static boolean hasValidCheckDigit(String digits) {
        int sum = 0;
        for (int i = 0; i < 9; i++) {
            sum += (digits.charAt(i) - '0') * WEIGHTS[i];
        }
        sum += ((digits.charAt(8) - '0') * 5) / 10;
        return (10 - sum % 10) % 10 == digits.charAt(9) - '0';
    }
}
