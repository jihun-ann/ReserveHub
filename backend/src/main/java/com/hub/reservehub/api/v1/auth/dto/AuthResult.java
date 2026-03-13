package com.hub.reservehub.api.v1.auth.dto;

import com.hub.reservehub.domain.user.User;

/**
 * Bundles a freshly issued access token with its authenticated user.
 * 새로 발급한 액세스 토큰과 인증된 사용자를 함께 묶는다.
 */
public record AuthResult(String accessToken, User user) {
}
