package com.hub.reservehub.api.v1.auth;

import static org.hamcrest.Matchers.equalTo;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

/**
 * Exercises the actual login/register/me endpoints end-to-end through the real security filter
 * chain — this is the one thing a compile pass or the existing unit tests don't cover: does the
 * JWT this issues actually authenticate a subsequent request, and does a missing/invalid token
 * get rejected.
 */
@SpringBootTest
@AutoConfigureMockMvc
class AuthFlowTest {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void registerThenLoginIssuesAWorkingBearerToken() throws Exception {
        // @Pattern on the username caps it at 20 chars, so keep the uniqueness suffix short.
        String username = "auth" + (System.nanoTime() % 1_000_000L);
        String registerBody = """
                {"username":"%s","email":"%s@example.com","password":"password123","role":"USER","name":"Auth Test"}
                """.formatted(username, username);

        mockMvc.perform(post("/api/v1/auth/register").contentType(MediaType.APPLICATION_JSON).content(registerBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.accessToken").exists());

        String loginBody = """
                {"username":"%s","password":"password123"}
                """.formatted(username);

        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON).content(loginBody))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode loginJson = objectMapper.readTree(loginResult.getResponse().getContentAsString());
        String token = loginJson.get("accessToken").asText();

        mockMvc.perform(get("/api/v1/auth/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username", equalTo(username)))
                .andExpect(jsonPath("$.role", equalTo("USER")));
    }

    @Test
    void meIsRejectedWithoutOrWithAGarbageBearerToken() throws Exception {
        mockMvc.perform(get("/api/v1/auth/me")).andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/v1/auth/me").header("Authorization", "Bearer not-a-real-token"))
                .andExpect(status().isUnauthorized());
    }
}
