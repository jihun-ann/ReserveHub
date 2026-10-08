package com.hub.reservehub.security;

import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
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
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

/**
 * Configures stateless JWT bearer-token security — login/register mint a signed access token,
 * every other request carries it in the Authorization header, and JwtAuthenticationFilter restores
 * the principal from it before controllers run. No server-side session exists to invalidate.
 * 무상태 JWT bearer 토큰 인증을 구성한다 — 로그인/회원가입이 서명된 액세스 토큰을 발급하고, 이후
 * 모든 요청은 Authorization 헤더로 이를 실어 보내며, JwtAuthenticationFilter가 컨트롤러 실행 전에
 * 토큰으로부터 인증 정보를 복원한다. 서버 측에 무효화할 세션이 존재하지 않는다.
 */
@Configuration
@EnableMethodSecurity
@EnableConfigurationProperties(JwtProperties.class)
public class SecurityConfig {

    private final RestAuthenticationEntryPoint authenticationEntryPoint;
    private final RestAccessDeniedHandler accessDeniedHandler;
    private final AuthenticatedUserService authenticatedUserService;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Value("${app.cors.allowed-origins:http://localhost:5173,http://localhost:3000}")
    private List<String> allowedOrigins;

    public SecurityConfig(
            RestAuthenticationEntryPoint authenticationEntryPoint,
            RestAccessDeniedHandler accessDeniedHandler,
            AuthenticatedUserService authenticatedUserService,
            JwtAuthenticationFilter jwtAuthenticationFilter
    ) {
        this.authenticationEntryPoint = authenticationEntryPoint;
        this.accessDeniedHandler = accessDeniedHandler;
        this.authenticatedUserService = authenticatedUserService;
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    // CSRF stays off: a bearer token in the Authorization header is never sent automatically by the
    // browser (unlike a cookie), so cross-site requests simply have no way to attach it — no CSRF
    // defense to build here.
    // CSRF는 끈다: Authorization 헤더의 bearer 토큰은 쿠키와 달리 브라우저가 자동으로 실어 보내지
    // 않으므로, 크로스사이트 요청은애초에 이걸 붙일 방법이 없다 — 별도 CSRF 방어가 필요 없다.
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable)
                .cors(Customizer.withDefaults())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint(authenticationEntryPoint)
                        .accessDeniedHandler(accessDeniedHandler))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/v1/health").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/v1/auth/login", "/api/v1/auth/register").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/staff-invitations/token/*").permitAll()
                        .anyRequest().authenticated()
                )
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

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
