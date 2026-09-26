package com.yukunxu.data4life.catalogue;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class ColumnFlowTest {

    private static final String WIDTHS = """
            {"isbn": 10, "titleAuthor": 40, "genreLanguage": 20, "amount": 10, "stock": 10, "actions": 10}
            """;

    @Autowired
    private MockMvc mockMvc;

    private MockHttpSession admin;

    @BeforeEach
    void setUp() throws Exception {
        admin = signUpAndLogin("admin@example.com");
    }

    @Test
    void startsEmptyThenRoundTrips() throws Exception {
        mockMvc.perform(get("/api/catalogue/columns").session(admin))
                .andExpect(status().isOk())
                .andExpect(content().string(""));

        mockMvc.perform(put("/api/catalogue/columns").session(admin)
                        .contentType(MediaType.APPLICATION_JSON).content(WIDTHS))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.titleAuthor").value(40.0));

        mockMvc.perform(get("/api/catalogue/columns").session(admin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isbn").value(10.0))
                .andExpect(jsonPath("$.actions").value(10.0));
    }

    @Test
    void rejectsWidthsThatDoNotTotalHundredOrGoBelowMinimum() throws Exception {
        mockMvc.perform(put("/api/catalogue/columns").session(admin)
                        .contentType(MediaType.APPLICATION_JSON).content("""
                                {"isbn": 10, "titleAuthor": 40, "genreLanguage": 20, "amount": 10, "stock": 10, "actions": 20}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Column widths must total 100"));

        mockMvc.perform(put("/api/catalogue/columns").session(admin)
                        .contentType(MediaType.APPLICATION_JSON).content("""
                                {"isbn": 2, "titleAuthor": 48, "genreLanguage": 20, "amount": 10, "stock": 10, "actions": 10}
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void nonAdminIsForbiddenAndAnonymousUnauthorized() throws Exception {
        MockHttpSession user = signUpAndLogin("ada@example.com");

        mockMvc.perform(get("/api/catalogue/columns").session(user)).andExpect(status().isForbidden());
        mockMvc.perform(put("/api/catalogue/columns").session(user)
                        .contentType(MediaType.APPLICATION_JSON).content(WIDTHS))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/catalogue/columns")).andExpect(status().isUnauthorized());
    }

    private MockHttpSession signUpAndLogin(String email) throws Exception {
        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name": "Tester", "email": "%s", "password": "secret123"}
                                """.formatted(email)))
                .andExpect(status().isCreated());
        return (MockHttpSession) mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email": "%s", "password": "secret123"}
                                """.formatted(email)))
                .andExpect(status().isOk())
                .andReturn().getRequest().getSession();
    }
}
