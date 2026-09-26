package com.yukunxu.data4life.admin;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.yukunxu.data4life.catalogue.BookRepository;
import com.yukunxu.data4life.loan.Loan;
import com.yukunxu.data4life.loan.LoanRepository;
import com.yukunxu.data4life.loan.LoanService;
import com.yukunxu.data4life.user.User;
import com.yukunxu.data4life.user.UserRepository;
import java.time.Duration;
import java.time.Instant;
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
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AdminUserFlowTest {

    private static final String SAPIENS = "9780062316097";
    private static final String CHRISTIE = "9780062693662";
    private static final String KOKORO = "9784101010137";
    private static final String RED_CHAMBER = "9787020002207";
    private static final String DUNE = "9780441172719";
    private static final String COLUMNS = """
            {"nameEmail": 30, "admin": 10, "joined": 14, "borrows": 16, "fines": 16, "actions": 14}
            """;

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BookRepository bookRepository;

    @Autowired
    private LoanRepository loanRepository;

    private MockHttpSession root;
    private Instant now;

    @BeforeEach
    void setUp() throws Exception {
        signUp("Root", "admin@example.com");
        root = login("admin@example.com");
        now = Instant.now();
    }

    @Test
    void listShapeAndStats() throws Exception {
        signUp("Ada", "ada@example.com");
        User ada = user("ada@example.com");
        loan(ada, SAPIENS, now.minus(days(20)).plus(Duration.ofHours(1)), null, null, null);
        loan(ada, CHRISTIE, now.minus(days(3)), null, null, null);
        loan(ada, KOKORO, now.minus(days(40)), now.minus(days(20)), null, null);
        loan(ada, RED_CHAMBER, now.minus(days(60)), now.minus(days(40)), now.minus(days(39)), null);
        loan(ada, DUNE, now.minus(days(70)), now.minus(days(50)), null, now.minus(days(49)));

        mockMvc.perform(get("/api/admin/users").session(root))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.users.length()").value(2))
                .andExpect(jsonPath("$.page").value(0))
                .andExpect(jsonPath("$.totalPages").value(1))
                .andExpect(jsonPath("$.total").value(2))
                .andExpect(jsonPath("$.users[0].id").value(ada.getId()))
                .andExpect(jsonPath("$.users[0].name").value("Ada"))
                .andExpect(jsonPath("$.users[0].email").value("ada@example.com"))
                .andExpect(jsonPath("$.users[0].createdAt").isNotEmpty())
                .andExpect(jsonPath("$.users[0].admin").value(false))
                .andExpect(jsonPath("$.users[0].totalBorrows").value(5))
                .andExpect(jsonPath("$.users[0].currentBorrows").value(2))
                .andExpect(jsonPath("$.users[0].totalFines").value(24.0))
                .andExpect(jsonPath("$.users[0].currentFines").value(12.0))
                .andExpect(jsonPath("$.users[0].demotable").value(false))
                .andExpect(jsonPath("$.users[1].name").value("Root"))
                .andExpect(jsonPath("$.users[1].admin").value(true))
                .andExpect(jsonPath("$.users[1].totalFines").value(0.0))
                .andExpect(jsonPath("$.users[1].demotable").value(false))
                .andExpect(jsonPath("$.filters.name[0]").value("Ada"))
                .andExpect(jsonPath("$.filters.email.length()").value(2))
                .andExpect(jsonPath("$.filters.admin[0]").value(false))
                .andExpect(jsonPath("$.filters.admin[1]").value(true))
                .andExpect(jsonPath("$.filters.totalBorrows[1]").value(5))
                .andExpect(jsonPath("$.filters.totalFines[1]").value(24.0))
                .andExpect(jsonPath("$.filters.currentFines[1]").value(12.0));
    }

    @Test
    void sortsFiltersAndClampsPage() throws Exception {
        signUp("Ada", "ada@example.com");
        loan(user("ada@example.com"), KOKORO, now.minus(days(40)), now.minus(days(20)), null, null);
        signUp("bob", "bob@example.com");

        mockMvc.perform(get("/api/admin/users").param("sort", "currentFines").param("dir", "desc")
                        .session(root))
                .andExpect(jsonPath("$.users[0].email").value("ada@example.com"));
        mockMvc.perform(get("/api/admin/users").param("sort", "name").param("dir", "desc").session(root))
                .andExpect(jsonPath("$.users[0].name").value("Root"))
                .andExpect(jsonPath("$.users[1].name").value("bob"));
        mockMvc.perform(get("/api/admin/users").param("admin", "true").session(root))
                .andExpect(jsonPath("$.total").value(1))
                .andExpect(jsonPath("$.users[0].email").value("admin@example.com"));
        mockMvc.perform(get("/api/admin/users").param("totalFines", "6").session(root))
                .andExpect(jsonPath("$.total").value(1))
                .andExpect(jsonPath("$.users[0].email").value("ada@example.com"));
        mockMvc.perform(get("/api/admin/users").param("admin", "false").param("totalBorrows", "0")
                        .session(root))
                .andExpect(jsonPath("$.total").value(1))
                .andExpect(jsonPath("$.users[0].email").value("bob@example.com"));

        for (int i = 0; i < 8; i++) {
            userRepository.save(new User("user" + i + "@example.com", "User " + i, "hash"));
        }
        mockMvc.perform(get("/api/admin/users").param("page", "5").session(root))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.page").value(1))
                .andExpect(jsonPath("$.totalPages").value(2))
                .andExpect(jsonPath("$.total").value(11))
                .andExpect(jsonPath("$.users.length()").value(1));
    }

    @Test
    void invalidPageSizeOrSortIsBadRequest() throws Exception {
        mockMvc.perform(get("/api/admin/users").param("size", "15").session(root))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Invalid page size"));
        mockMvc.perform(get("/api/admin/users").param("sort", "password").session(root))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Invalid sort"));
        mockMvc.perform(get("/api/admin/users").param("dir", "up").session(root))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Invalid sort"));
    }

    @Test
    void promote() throws Exception {
        signUp("Ada", "ada@example.com");
        User ada = user("ada@example.com");

        mockMvc.perform(post("/api/admin/users/{id}/promote", ada.getId()).session(root))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(ada.getId()))
                .andExpect(jsonPath("$.admin").value(true))
                .andExpect(jsonPath("$.demotable").value(true));
        assertThat(ada.isAdmin()).isTrue();
        assertThat(ada.getPromotedById()).isEqualTo(user("admin@example.com").getId());

        mockMvc.perform(post("/api/admin/users/{id}/promote", ada.getId()).session(root))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("User is already an admin"));
        mockMvc.perform(post("/api/admin/users/{id}/promote", -1).session(root))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("User not found"));
    }

    @Test
    void demoteRules() throws Exception {
        signUp("Legacy", "legacy@example.com");
        user("legacy@example.com").setAdmin(true);
        signUp("Bea", "bea@example.com");
        signUp("Cal", "cal@example.com");
        signUp("Dan", "dan@example.com");
        signUp("Eve", "eve@example.com");
        User bea = user("bea@example.com");
        User cal = user("cal@example.com");
        User dan = user("dan@example.com");
        promote(root, bea);
        promote(root, dan);
        MockHttpSession beaSession = login("bea@example.com");
        MockHttpSession danSession = login("dan@example.com");
        promote(beaSession, cal);

        mockMvc.perform(get("/api/admin/users").param("sort", "email").session(beaSession))
                .andExpect(jsonPath("$.users[0].email").value("admin@example.com"))
                .andExpect(jsonPath("$.users[0].demotable").value(false))
                .andExpect(jsonPath("$.users[1].email").value("bea@example.com"))
                .andExpect(jsonPath("$.users[1].demotable").value(false))
                .andExpect(jsonPath("$.users[2].email").value("cal@example.com"))
                .andExpect(jsonPath("$.users[2].demotable").value(true))
                .andExpect(jsonPath("$.users[3].email").value("dan@example.com"))
                .andExpect(jsonPath("$.users[3].demotable").value(false))
                .andExpect(jsonPath("$.users[5].email").value("legacy@example.com"))
                .andExpect(jsonPath("$.users[5].demotable").value(false));

        demote(danSession, cal).andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Only the admin who promoted this user can demote them"));
        demote(beaSession, user("legacy@example.com")).andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Only the admin who promoted this user can demote them"));
        demote(beaSession, bea).andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("You cannot demote yourself"));
        demote(beaSession, user("admin@example.com")).andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("The root admin cannot be demoted"));
        demote(root, user("admin@example.com")).andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("The root admin cannot be demoted"));
        demote(beaSession, user("eve@example.com")).andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("User is not an admin"));
        mockMvc.perform(post("/api/admin/users/{id}/demote", -1).session(root))
                .andExpect(status().isNotFound());

        demote(beaSession, cal).andExpect(status().isOk())
                .andExpect(jsonPath("$.admin").value(false))
                .andExpect(jsonPath("$.demotable").value(false));
        assertThat(cal.getPromotedById()).isNull();
        demote(root, user("legacy@example.com")).andExpect(status().isOk());
        demote(root, bea).andExpect(status().isOk());
        assertThat(bea.isAdmin()).isFalse();
    }

    @Test
    void roleChangeExpiresTargetSessions() throws Exception {
        signUp("Bea", "bea@example.com");
        signUp("Ada", "ada@example.com");
        User bea = user("bea@example.com");
        MockHttpSession beaAsUser = login("bea@example.com");
        MockHttpSession ada = login("ada@example.com");

        promote(root, bea);
        mockMvc.perform(get("/api/auth/me").session(beaAsUser)).andExpect(status().isUnauthorized());

        MockHttpSession beaAsAdmin = login("bea@example.com");
        mockMvc.perform(get("/api/admin/users").session(beaAsAdmin)).andExpect(status().isOk());

        demote(root, bea).andExpect(status().isOk());
        mockMvc.perform(get("/api/admin/users").session(beaAsAdmin)).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/auth/me").session(ada)).andExpect(status().isOk());
        mockMvc.perform(get("/api/auth/me").session(root)).andExpect(status().isOk());

        MockHttpSession beaAgain = login("bea@example.com");
        mockMvc.perform(get("/api/admin/users").session(beaAgain)).andExpect(status().isForbidden());
    }

    @Test
    void deleteRules() throws Exception {
        signUp("Bea", "bea@example.com");
        signUp("Cal", "cal@example.com");
        signUp("Dan", "dan@example.com");
        signUp("Eve", "eve@example.com");
        signUp("Fay", "fay@example.com");
        User bea = user("bea@example.com");
        User cal = user("cal@example.com");
        User dan = user("dan@example.com");
        User eve = user("eve@example.com");
        User fay = user("fay@example.com");
        promote(root, bea);
        promote(root, dan);
        MockHttpSession beaSession = login("bea@example.com");
        MockHttpSession danSession = login("dan@example.com");
        promote(beaSession, cal);
        loan(eve, SAPIENS, now.minus(days(3)), null, null, null);
        loan(fay, KOKORO, now.minus(days(40)), now.minus(days(20)), null, null);

        mockMvc.perform(get("/api/admin/users").param("sort", "email").session(beaSession))
                .andExpect(jsonPath("$.users[0].email").value("admin@example.com"))
                .andExpect(jsonPath("$.users[0].deletable").value(false))
                .andExpect(jsonPath("$.users[1].email").value("bea@example.com"))
                .andExpect(jsonPath("$.users[1].deletable").value(false))
                .andExpect(jsonPath("$.users[2].email").value("cal@example.com"))
                .andExpect(jsonPath("$.users[2].deletable").value(true))
                .andExpect(jsonPath("$.users[3].email").value("dan@example.com"))
                .andExpect(jsonPath("$.users[3].deletable").value(false))
                .andExpect(jsonPath("$.users[4].email").value("eve@example.com"))
                .andExpect(jsonPath("$.users[4].deletable").value(true));

        remove(danSession, cal).andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Only the admin who promoted this user can delete them"));
        remove(beaSession, bea).andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("You cannot delete yourself"));
        remove(beaSession, user("admin@example.com")).andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("The root admin cannot be deleted"));
        remove(root, eve).andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("User still has books on loan"));
        remove(root, fay).andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("User still has unpaid fines"));
        mockMvc.perform(delete("/api/admin/users/{id}", -1).session(root)).andExpect(status().isNotFound());

        MockHttpSession calSession = login("cal@example.com");
        remove(beaSession, cal).andExpect(status().isNoContent());
        assertThat(userRepository.findByEmail("cal@example.com")).isEmpty();
        mockMvc.perform(get("/api/auth/me").session(calSession)).andExpect(status().isUnauthorized());

        forgive(fay, loanRepository.findByUserNewestFirst(fay).getFirst()).andExpect(status().isOk());
        remove(danSession, fay).andExpect(status().isNoContent());
        assertThat(loanRepository.existsByUser(fay)).isFalse();

        remove(root, bea).andExpect(status().isNoContent());
        assertThat(userRepository.findByEmail("bea@example.com")).isEmpty();
    }

    @Test
    void reservationsAreNotBorrowsAndBlockDeletion() throws Exception {
        signUp("Gus", "gus@example.com");
        User gus = user("gus@example.com");
        loan(gus, CHRISTIE, now.minus(days(3)), null, null, null);
        Loan active = reserve(gus, SAPIENS, now.plus(days(3)));
        reserve(gus, KOKORO, now.minus(Duration.ofHours(1)));

        mockMvc.perform(get("/api/admin/users").param("email", "gus@example.com").session(root))
                .andExpect(jsonPath("$.users[0].totalBorrows").value(1))
                .andExpect(jsonPath("$.users[0].currentBorrows").value(1))
                .andExpect(jsonPath("$.users[0].totalFines").value(0.0));

        remove(root, gus).andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("User still has books on loan"));
        loanRepository.findByUserNewestFirst(gus).stream()
                .filter(loan -> loan.getBorrowedAt() != null)
                .forEach(loan -> loan.setReturnedAt(now));
        remove(root, gus).andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("User still has a reservation"));

        active.setReservedUntil(now.minus(Duration.ofMinutes(1)));
        remove(root, gus).andExpect(status().isNoContent());
        assertThat(loanRepository.existsByUser(gus)).isFalse();
    }

    @Test
    void deleteOwnAccount() throws Exception {
        signUp("Bea", "bea@example.com");
        signUp("Cal", "cal@example.com");
        User bea = user("bea@example.com");
        User cal = user("cal@example.com");
        promote(root, bea);
        MockHttpSession beaSession = login("bea@example.com");
        promote(beaSession, cal);
        loan(bea, DUNE, now.minus(days(60)), now.minus(days(40)), now.minus(days(39)), null);

        mockMvc.perform(delete("/api/auth/me").session(root)).andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("The root admin cannot be deleted"));
        mockMvc.perform(delete("/api/auth/me")).andExpect(status().isUnauthorized());

        mockMvc.perform(delete("/api/auth/me").session(beaSession)).andExpect(status().isNoContent());
        assertThat(userRepository.findByEmail("bea@example.com")).isEmpty();
        assertThat(cal.getPromotedById()).isNull();
        assertThat(userRepository.findByEmail("cal@example.com")).isPresent();
        mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content("""
                {"email": "bea@example.com", "password": "secret123"}
                """)).andExpect(status().isUnauthorized());
    }

    @Test
    void finesAndForgive() throws Exception {
        signUp("Ada", "ada@example.com");
        User ada = user("ada@example.com");
        MockHttpSession adaSession = login("ada@example.com");
        loan(ada, CHRISTIE, now.minus(days(3)), null, null, null);
        Loan overdue = loan(ada, SAPIENS, now.minus(days(20)).plus(Duration.ofHours(1)), null, null, null);
        Loan unpaid = loan(ada, KOKORO, now.minus(days(40)), now.minus(days(20)), null, null);
        Loan paid = loan(ada, RED_CHAMBER, now.minus(days(60)), now.minus(days(40)), now.minus(days(39)), null);

        mockMvc.perform(get("/api/admin/users/{id}/fines", ada.getId()).session(root))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(3))
                .andExpect(jsonPath("$[0].id").value(overdue.getId()))
                .andExpect(jsonPath("$[0].status").value("OVERDUE"))
                .andExpect(jsonPath("$[1].status").value("UNPAID"))
                .andExpect(jsonPath("$[1].fine").value(6.0))
                .andExpect(jsonPath("$[2].status").value("PAID"));

        forgive(ada, unpaid).andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(3))
                .andExpect(jsonPath("$[1].id").value(unpaid.getId()))
                .andExpect(jsonPath("$[1].status").value("FORGIVEN"));
        assertThat(unpaid.getFineForgivenAt()).isNotNull();

        mockMvc.perform(post("/api/loans/{id}/pay", unpaid.getId()).session(adaSession))
                .andExpect(status().isConflict());
        mockMvc.perform(get("/api/loans").session(adaSession))
                .andExpect(jsonPath("$.stats.totalOverdueFines").value(0.0));
        mockMvc.perform(get("/api/admin/users").param("email", "ada@example.com").session(root))
                .andExpect(jsonPath("$.users[0].totalFines").value(18.0))
                .andExpect(jsonPath("$.users[0].currentFines").value(6.0));

        forgive(ada, unpaid).andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("This loan has no unpaid fine"));
        forgive(ada, paid).andExpect(status().isConflict());
        forgive(ada, overdue).andExpect(status().isConflict());
        forgive(user("admin@example.com"), paid).andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Loan not found"));
        mockMvc.perform(get("/api/admin/users/{id}/fines", -1).session(root))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("User not found"));
    }

    @Test
    void columnWidthsPersistPerAdmin() throws Exception {
        mockMvc.perform(get("/api/admin/users/columns").session(root))
                .andExpect(status().isOk())
                .andExpect(content().string(""));

        send(put("/api/admin/users/columns"), root, COLUMNS)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nameEmail").value(30.0));

        mockMvc.perform(get("/api/admin/users/columns").session(root))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nameEmail").value(30.0))
                .andExpect(jsonPath("$.actions").value(14.0));
        assertThat(user("admin@example.com").getUsersColumns()).isEqualTo("30.0,10.0,14.0,16.0,16.0,14.0");

        send(put("/api/admin/users/columns"), root, COLUMNS.replace("30", "40"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Column widths must total 100"));
        send(put("/api/admin/users/columns"), root, COLUMNS.replace("\"admin\": 10", "\"admin\": 4")
                        .replace("30", "36"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void nonAdminIsForbiddenAndAnonymousUnauthorized() throws Exception {
        signUp("Ada", "ada@example.com");
        MockHttpSession ada = login("ada@example.com");
        long id = user("ada@example.com").getId();

        for (MockHttpServletRequestBuilder request : routes(id)) {
            mockMvc.perform(request.session(ada).contentType(MediaType.APPLICATION_JSON).content(COLUMNS))
                    .andExpect(status().isForbidden());
        }
        for (MockHttpServletRequestBuilder request : routes(id)) {
            mockMvc.perform(request.contentType(MediaType.APPLICATION_JSON).content(COLUMNS))
                    .andExpect(status().isUnauthorized());
        }
    }

    private static MockHttpServletRequestBuilder[] routes(long id) {
        return new MockHttpServletRequestBuilder[] {
            get("/api/admin/users"),
            post("/api/admin/users/{id}/promote", id),
            post("/api/admin/users/{id}/demote", id),
            delete("/api/admin/users/{id}", id),
            get("/api/admin/users/{id}/fines", id),
            post("/api/admin/users/{id}/loans/{loanId}/forgive", id, 1),
            get("/api/admin/users/columns"),
            put("/api/admin/users/columns"),
        };
    }

    private void promote(MockHttpSession session, User target) throws Exception {
        mockMvc.perform(post("/api/admin/users/{id}/promote", target.getId()).session(session))
                .andExpect(status().isOk());
    }

    private ResultActions demote(MockHttpSession session, User target) throws Exception {
        return mockMvc.perform(post("/api/admin/users/{id}/demote", target.getId()).session(session));
    }

    private ResultActions remove(MockHttpSession session, User target) throws Exception {
        return mockMvc.perform(delete("/api/admin/users/{id}", target.getId()).session(session));
    }

    private ResultActions forgive(User owner, Loan loan) throws Exception {
        return mockMvc.perform(post("/api/admin/users/{id}/loans/{loanId}/forgive", owner.getId(), loan.getId())
                .session(root));
    }

    private ResultActions send(MockHttpServletRequestBuilder request, MockHttpSession session, String json)
            throws Exception {
        return mockMvc.perform(request.session(session).contentType(MediaType.APPLICATION_JSON).content(json));
    }

    private Loan loan(User user, String isbn, Instant borrowedAt, Instant returnedAt, Instant finePaidAt,
            Instant fineForgivenAt) {
        Loan loan = new Loan(user, bookRepository.findById(isbn).orElseThrow(), borrowedAt,
                borrowedAt.plus(days(LoanService.LOAN_DAYS)));
        loan.setReturnedAt(returnedAt);
        loan.setFinePaidAt(finePaidAt);
        loan.setFineForgivenAt(fineForgivenAt);
        return loanRepository.save(loan);
    }

    private Loan reserve(User user, String isbn, Instant reservedUntil) {
        return loanRepository.save(Loan.reserved(user, bookRepository.findById(isbn).orElseThrow(),
                reservedUntil.minus(days(LoanService.RESERVE_DAYS)), reservedUntil));
    }

    private User user(String email) {
        return userRepository.findByEmail(email).orElseThrow();
    }

    private static Duration days(long days) {
        return Duration.ofDays(days);
    }

    private void signUp(String name, String email) throws Exception {
        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name": "%s", "email": "%s", "password": "secret123"}
                                """.formatted(name, email)))
                .andExpect(status().isCreated());
    }

    private MockHttpSession login(String email) throws Exception {
        return (MockHttpSession) mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email": "%s", "password": "secret123"}
                                """.formatted(email)))
                .andExpect(status().isOk())
                .andReturn().getRequest().getSession();
    }
}
