package com.yukunxu.data4life.user;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class UserFlowTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void createLoginMeLogout() throws Exception {
        createUser("Ada", "ada@example.com", "secret123")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.name").value("Ada"))
                .andExpect(jsonPath("$.email").value("ada@example.com"))
                .andExpect(jsonPath("$.createdAt").isString())
                .andExpect(jsonPath("$.admin").value(false))
                .andExpect(jsonPath("$.avatar").value("ACCOUNT"))
                .andExpect(jsonPath("$.password").doesNotExist());

        MockHttpSession session = (MockHttpSession) login("ADA@example.com", "secret123")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("ada@example.com"))
                .andReturn().getRequest().getSession();

        mockMvc.perform(get("/api/auth/me").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Ada"))
                .andExpect(jsonPath("$.admin").value(false));

        mockMvc.perform(post("/api/auth/logout").session(session))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/auth/me").session(session))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void adminEmailGetsAdminFlag() throws Exception {
        createUser("Admin", "admin@example.com", "secret123")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.admin").value(true));

        MockHttpSession session = (MockHttpSession) login("admin@example.com", "secret123")
                .andExpect(status().isOk())
                .andReturn().getRequest().getSession();

        mockMvc.perform(get("/api/auth/me").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.admin").value(true));
    }

    @Test
    void meWithoutSessionIsUnauthorized() throws Exception {
        mockMvc.perform(get("/api/auth/me")).andExpect(status().isUnauthorized());
    }

    @Test
    void duplicateEmailIsConflict() throws Exception {
        createUser("Ada", "ada@example.com", "secret123").andExpect(status().isCreated());
        createUser("Ada Two", "ada@example.com", "secret456")
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").isString());
    }

    @Test
    void wrongPasswordIsUnauthorized() throws Exception {
        createUser("Ada", "ada@example.com", "secret123").andExpect(status().isCreated());
        login("ada@example.com", "wrong-password")
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Incorrect email or password"));
    }

    @Test
    void invalidBodyIsBadRequest() throws Exception {
        createUser("Ada", "not-an-email", "secret123")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").isString());
        createUser("Ada", "ada@example.com", "short")
                .andExpect(status().isBadRequest());
        createUser("Ada", "ada@example.com", "has spaces 123")
                .andExpect(status().isBadRequest());
    }

    @Test
    void updateProfileChangesNameAndAvatar() throws Exception {
        MockHttpSession session = signUpAndLogin();

        updateProfile(session, "  Ada Lovelace ", "ROCKET")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Ada Lovelace"))
                .andExpect(jsonPath("$.avatar").value("ROCKET"));

        mockMvc.perform(get("/api/auth/me").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Ada Lovelace"))
                .andExpect(jsonPath("$.avatar").value("ROCKET"));
    }

    @Test
    void updateProfileRejectsBlankNameAndUnknownAvatar() throws Exception {
        MockHttpSession session = signUpAndLogin();

        updateProfile(session, " ", "ROCKET")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").isString());
        updateProfile(session, "Ada", "DRAGON")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Invalid request"));
    }

    @Test
    void updateProfileWithoutSessionIsUnauthorized() throws Exception {
        mockMvc.perform(put("/api/users/me")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name": "Ada", "avatar": "ROCKET"}
                                """))
                .andExpect(status().isUnauthorized());
    }

    private MockHttpSession signUpAndLogin() throws Exception {
        createUser("Ada", "ada@example.com", "secret123").andExpect(status().isCreated());
        return (MockHttpSession) login("ada@example.com", "secret123")
                .andExpect(status().isOk())
                .andReturn().getRequest().getSession();
    }

    private ResultActions updateProfile(MockHttpSession session, String name, String avatar) throws Exception {
        return mockMvc.perform(put("/api/users/me")
                .session(session)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"name": "%s", "avatar": "%s"}
                        """.formatted(name, avatar)));
    }

    private ResultActions createUser(String name, String email, String password) throws Exception {
        return mockMvc.perform(post("/api/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"name": "%s", "email": "%s", "password": "%s"}
                        """.formatted(name, email, password)));
    }

    private ResultActions login(String email, String password) throws Exception {
        return mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"email": "%s", "password": "%s"}
                        """.formatted(email, password)));
    }
}
