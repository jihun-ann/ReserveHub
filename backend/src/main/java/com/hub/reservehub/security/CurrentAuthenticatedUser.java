package com.hub.reservehub.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/**
 * Reads the current authenticated principal from the security context.
 * SecurityContext에서 현재 인증된 사용자를 읽어온다.
 */
@Component
public class CurrentAuthenticatedUser {

    // Reads the principal once so controllers do not repeat SecurityContext access code.
    // 컨트롤러가 SecurityContext 접근 코드를 반복하지 않도록 현재 사용자를 한 번에 읽는다.
    public AuthenticatedUser get() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof AuthenticatedUser user)) {
            throw new IllegalStateException("Authenticated user not found");
        }
        return user;
    }
}
