package com.hub.reservehub.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hub.reservehub.common.exception.ApiError;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

/**
 * Returns a JSON 401 response when unauthenticated requests hit protected endpoints.
 * 미인증 요청이 보호된 엔드포인트에 접근하면 JSON 형태의 401 응답을 반환한다.
 */
@Component
public class RestAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private final ObjectMapper objectMapper;

    public RestAuthenticationEntryPoint(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    // Returns the API error shape instead of redirecting to a login page.
    // 로그인 페이지로 리다이렉트하지 않고 API 오류 형식으로 응답한다.
    public void commence(
            HttpServletRequest request,
            HttpServletResponse response,
            AuthenticationException authException
    ) throws IOException, ServletException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        objectMapper.writeValue(response.getWriter(), ApiError.of("UNAUTHORIZED", "Authentication is required"));
    }
}
