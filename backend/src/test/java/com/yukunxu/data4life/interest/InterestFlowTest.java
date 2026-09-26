package com.yukunxu.data4life.interest;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.yukunxu.data4life.catalogue.Genre;
import com.yukunxu.data4life.catalogue.GenreRepository;
import com.yukunxu.data4life.catalogue.Language;
import com.yukunxu.data4life.catalogue.LanguageRepository;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
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
class InterestFlowTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private GenreRepository genreRepository;

    @Autowired
    private LanguageRepository languageRepository;

    private MockHttpSession session;

    @BeforeEach
    void signUpAndLogin() throws Exception {
        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name": "Ada", "email": "ada@example.com", "password": "secret123"}
                                """))
                .andExpect(status().isCreated());
        session = (MockHttpSession) mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email": "ada@example.com", "password": "secret123"}
                                """))
                .andExpect(status().isOk())
                .andReturn().getRequest().getSession();
    }

    @Test
    void optionsAreSortedByName() throws Exception {
        mockMvc.perform(get("/api/interests/options").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.genres.length()").value(24))
                .andExpect(jsonPath("$.genres[0].name").value("Art"))
                .andExpect(jsonPath("$.genres[0].id").isNumber())
                .andExpect(jsonPath("$.languages.length()").value(17))
                .andExpect(jsonPath("$.languages[0].name").value("Arabic"));
    }

    @Test
    void newUserHasNoInterestsAndIsNotPrompted() throws Exception {
        mockMvc.perform(get("/api/interests").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.genres.length()").value(0))
                .andExpect(jsonPath("$.languages.length()").value(0))
                .andExpect(jsonPath("$.prompted").value(false));
    }

    @Test
    void saveReplacesInterestsAndMarksPrompted() throws Exception {
        List<Genre> genres = genreRepository.findAllByOrderByNameAsc();
        List<Language> languages = languageRepository.findAllByOrderByNameAsc();

        save(ids(genres.subList(0, 3)), ids(languages.subList(0, 2)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.genres.length()").value(3))
                .andExpect(jsonPath("$.languages.length()").value(2))
                .andExpect(jsonPath("$.prompted").value(true));

        mockMvc.perform(get("/api/interests").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.genres.length()").value(3))
                .andExpect(jsonPath("$.genres[0].name").value(genres.get(0).getName()))
                .andExpect(jsonPath("$.languages.length()").value(2))
                .andExpect(jsonPath("$.languages[0].name").value(languages.get(0).getName()))
                .andExpect(jsonPath("$.prompted").value(true));

        save(ids(genres.subList(3, 4)), "")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.genres.length()").value(1))
                .andExpect(jsonPath("$.genres[0].name").value(genres.get(3).getName()))
                .andExpect(jsonPath("$.languages.length()").value(0));
    }

    @Test
    void moreThanTenInterestsIsBadRequest() throws Exception {
        List<Genre> genres = genreRepository.findAllByOrderByNameAsc();

        save(ids(genres.subList(0, 11)), "")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Choose at most 10 interests"));
    }

    @Test
    void unknownIdIsBadRequest() throws Exception {
        save("999999", "")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Unknown genre"));
        save("", "999999")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Unknown language"));
    }

    @Test
    void skipMarksPrompted() throws Exception {
        mockMvc.perform(post("/api/interests/skip").session(session))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/interests").session(session))
                .andExpect(jsonPath("$.prompted").value(true))
                .andExpect(jsonPath("$.genres.length()").value(0));
    }

    @Test
    void withoutSessionIsUnauthorized() throws Exception {
        mockMvc.perform(get("/api/interests/options")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/interests")).andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/interests/skip")).andExpect(status().isUnauthorized());
    }

    private ResultActions save(String genreIds, String languageIds) throws Exception {
        return mockMvc.perform(put("/api/interests")
                .session(session)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"genreIds": [%s], "languageIds": [%s]}
                        """.formatted(genreIds, languageIds)));
    }

    private static String ids(List<?> items) {
        return String.join(",", items.stream()
                .map(item -> String.valueOf(item instanceof Genre genre ? genre.getId() : ((Language) item).getId()))
                .toList());
    }
}
