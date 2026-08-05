package com.hub.reservehub.common.exception;

import java.util.UUID;

// Signals that the current user has no access to the given platform (AGENT.md 4-1: platform_id 필수 필터).
public class PlatformAccessDeniedException extends RuntimeException {

    public PlatformAccessDeniedException(UUID platformId) {
        super("해당 플랫폼에 접근 권한이 없습니다. (platformId: " + platformId + ")");
    }
}
