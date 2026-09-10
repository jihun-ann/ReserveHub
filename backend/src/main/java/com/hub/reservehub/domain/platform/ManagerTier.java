package com.hub.reservehub.domain.platform;

/**
 * 매니저 권한 등급 — L/M/H 단계로 실제 할 수 있는 일을 제한한다. enum 선언 순서가 곧 권한 크기 순서라
 * ordinal() 비교로 "이 등급 이상"을 판단한다(PlatformAccessGuard.verifyManagerTier).
 */
public enum ManagerTier {
    LOW,
    MEDIUM,
    HIGH
}
