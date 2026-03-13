package com.hub.reservehub.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;
import javax.crypto.SecretKey;
import org.springframework.stereotype.Component;

/**
 * Creates and validates signed JWT access tokens for authenticated users.
 * 인증된 사용자를 위한 서명된 JWT 액세스 토큰을 생성하고 검증한다.
 */
@Component
public class JwtTokenProvider {

    private final JwtProperties jwtProperties;
    private final SecretKey signingKey;

    public JwtTokenProvider(JwtProperties jwtProperties) {
        this.jwtProperties = jwtProperties;
        this.signingKey = Keys.hmacShaKeyFor(jwtProperties.getSecret().getBytes(StandardCharsets.UTF_8));
    }

    // Issues a signed token containing the subject, user id, and role claims.
    // subject, 사용자 id, 역할 클레임을 담은 서명 토큰을 발급한다.
    public String createAccessToken(AuthenticatedUser user) {
        Instant now = Instant.now();
        Instant expiresAt = now.plus(jwtProperties.getAccessTokenExpiration());

        return Jwts.builder()
                .subject(user.getUsername())
                .claim("uid", user.getId().toString())
                .claim("role", user.getRole().name())
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiresAt))
                .signWith(signingKey)
                .compact();
    }

    // Extracts the email identifier used by UserDetailsService.
    // UserDetailsService가 사용하는 이메일 식별자를 추출한다.
    public String extractUsername(String token) {
        return parseClaims(token).getSubject();
    }

    // Extracts the user id claim for cases where domain lookups need a stable identifier.
    // 도메인 조회에 안정적인 식별자가 필요할 때 사용할 사용자 id 클레임을 추출한다.
    public UUID extractUserId(String token) {
        return UUID.fromString(parseClaims(token).get("uid", String.class));
    }

    // Centralizes token verification so all claim reads enforce signature and expiration checks.
    // 모든 클레임 조회에서 서명과 만료 검증이 강제되도록 토큰 검증 로직을 한곳에 모은다.
    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
