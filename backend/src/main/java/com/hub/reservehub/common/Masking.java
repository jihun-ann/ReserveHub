package com.hub.reservehub.common;

import org.springframework.lang.Nullable;

// 이메일/연락처를 알아볼 수는 있지만 그대로 쓸 수는 없게 가린다 — 로그, 로그인 전 공개 화면 등.
public final class Masking {

    private Masking() {
    }

    // jihun@gmail.com → j***@gmail.com, 01012345678 → 010****78
    @Nullable
    public static String contact(@Nullable String value) {
        if (value == null || value.isBlank()) {
            return value;
        }
        if (value.length() <= 4) {
            return "****";
        }
        int at = value.indexOf('@');
        if (at > 0) {
            return value.charAt(0) + "***" + value.substring(at);
        }
        return value.substring(0, 3) + "****" + value.substring(value.length() - 2);
    }
}
