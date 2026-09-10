package com.hub.reservehub.domain.platform;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

/**
 * DummyDataSeeder seeds three managers on the same demo platform at LOW/MEDIUM/HIGH tier
 * (manager-low@test.com, manager-mid@test.com, manager@test.com=HIGH). This checks the one thing
 * that actually matters about the tier system: a LOW-tier manager is rejected from deciding a
 * leave request, while the HIGH-tier one succeeds.
 */
@SpringBootTest
@AutoConfigureMockMvc
class ManagerTierAuthorizationTest {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private String login(String username) throws Exception {
        String body = "{\"username\":\"%s\",\"password\":\"test\"}".formatted(username);
        String response = mockMvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON).content(body))
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(response).get("accessToken").asText();
    }

    @Test
    void lowTierManagerCannotApproveLeaveButHighTierCan() throws Exception {
        String tutorToken = login("tutor");

        String platformsResponse = mockMvc.perform(get("/api/v1/platforms").header("Authorization", "Bearer " + tutorToken))
                .andReturn().getResponse().getContentAsString();
        String platformId = null;
        for (JsonNode platform : objectMapper.readTree(platformsResponse)) {
            if ("ReserveHub 테스트 스튜디오".equals(platform.get("name").asText())) {
                platformId = platform.get("id").asText();
                break;
            }
        }
        assertEquals(true, platformId != null, "Seeded demo platform not found");

        String leaveBody = "{\"startDate\":\"2026-12-01\",\"endDate\":\"2026-12-02\",\"reason\":\"tier test\"}";
        String leaveResponse = mockMvc.perform(
                        post("/api/v1/platforms/" + platformId + "/leave-requests")
                                .header("Authorization", "Bearer " + tutorToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(leaveBody)
                )
                .andReturn().getResponse().getContentAsString();
        String leaveRequestId = objectMapper.readTree(leaveResponse).get("id").asText();

        String lowTierToken = login("manager_low");
        mockMvc.perform(post("/api/v1/leave-requests/" + leaveRequestId + "/approve").header("Authorization", "Bearer " + lowTierToken))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isForbidden());

        String highTierToken = login("manager");
        mockMvc.perform(post("/api/v1/leave-requests/" + leaveRequestId + "/approve").header("Authorization", "Bearer " + highTierToken))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isOk())
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath("$.status").value("APPROVED"));
    }
}
