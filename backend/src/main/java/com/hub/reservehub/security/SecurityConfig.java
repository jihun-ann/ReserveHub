package com.hub.reservehub.security;

import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

/**
 * Configures server-session-based security (session id in an HttpOnly cookie — never in a
 * response body the frontend would have to cache in localStorage/sessionStorage), public auth
 * routes, and password encoding.
 * 서버 세션 기반 보안(세션 id는 HttpOnly 쿠키로만 전달 — 프론트가 localStorage/sessionStorage에
 * 캐시해야 하는 응답 바디에는 담지 않는다), 공개 인증 라우트, 비밀번호 인코더를 설정한다.
 */
@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    private final RestAuthenticationEntryPoint authenticationEntryPoint;
    private final RestAccessDeniedHandler accessDeniedHandler;
    private final AuthenticatedUserService authenticatedUserService;

    @Value("${app.cors.allowed-origins:http://localhost:5173,http://localhost:3000}")
    private List<String> allowedOrigins;

    public SecurityConfig(
            RestAuthenticationEntryPoint authenticationEntryPoint,
            RestAccessDeniedHandler accessDeniedHandler,
            AuthenticatedUserService authenticatedUserService
    ) {
        this.authenticationEntryPoint = authenticationEntryPoint;
        this.accessDeniedHandler = accessDeniedHandler;
        this.authenticatedUserService = authenticatedUserService;
    }

    @Bean
    // Session management defaults to IF_REQUIRED, so Spring Security's HttpSessionSecurityContextRepository
    // restores the principal from the session cookie on every request — no bearer token anywhere.
    // CSRF stays off deliberately: the session cookie is SameSite=Lax (set in application.properties),
    // which browsers already withhold on cross-site POST/PATCH/DELETE (only a top-level GET navigation
    // gets it), and CORS below only trusts explicit origins with credentials — the two together are the
    // CSRF defense here instead of a token dance, which would need its own careful wiring to get right.
    // 세션 관리는 기본값(IF_REQUIRED)으로 둬서, Spring Security의 HttpSessionSecurityContextRepository가
    // 매 요청마다 세션 쿠키로 사용자를 복원한다 — 어디에도 bearer 토큰이 없다. CSRF는 의도적으로 끈다:
    // 세션 쿠키가 SameSite=Lax(application.properties)라 크로스사이트 POST/PATCH/DELETE에는 브라우저가
    // 아예 실어 보내지 않고(최상위 GET 이동에만 실림), 아래 CORS도 명시된 오리진 + credentials만
    // 허용하므로 이 둘이 CSRF 방어를 대신한다 — 별도 토큰 방식은 잘못 붙이기 쉬워 여기서는 피한다.
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable)
                .cors(Customizer.withDefaults())
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint(authenticationEntryPoint)
                        .accessDeniedHandler(accessDeniedHandler))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/v1/health").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/v1/auth/login", "/api/v1/auth/register").permitAll()
                        .anyRequest().authenticated()
                )
                .authenticationProvider(authenticationProvider())
                .logout(logout -> logout
                        .logoutUrl("/api/v1/auth/logout")
                        .logoutSuccessHandler((request, response, authentication) -> response.setStatus(204))
                        .invalidateHttpSession(true)
                        .deleteCookies("JSESSIONID"));

        return http.build();
    }

    @Bean
    // Binds password verification to the same user lookup service used across authentication.
    // 인증 전반에서 쓰는 동일한 사용자 조회 서비스에 비밀번호 검증을 연결한다.
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider(authenticatedUserService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    // Exposes Spring Security's authentication pipeline to the auth service.
    // Spring Security 인증 파이프라인을 auth 서비스에서 사용할 수 있게 노출한다.
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }

    @Bean
    // Stores passwords as BCrypt hashes rather than plain text.
    // 비밀번호를 평문 대신 BCrypt 해시로 저장한다.
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    // Allows the local Vite dev server (and any origin listed in app.cors.allowed-origins) to call the API.
    // 로컬 Vite 개발 서버(및 app.cors.allowed-origins에 명시된 오리진)가 API를 호출할 수 있도록 허용한다.
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(allowedOrigins);
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        // The session cookie only reaches the browser (and gets sent back) on credentialed
        // cross-origin requests; the frontend must pair this with fetch(..., { credentials: "include" }).
        // 세션 쿠키는 credentialed 크로스오리진 요청에서만 브라우저에 오가므로, 프론트도
        // fetch(..., { credentials: "include" })로 맞춰야 한다.
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
