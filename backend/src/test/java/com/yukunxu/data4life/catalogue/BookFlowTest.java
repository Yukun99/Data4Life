package com.yukunxu.data4life.catalogue;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

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
class BookFlowTest {

    private static final String DUNE = "9780441172719";
    private static final String KOKORO = "9784101010137";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BookRepository bookRepository;

    @Autowired
    private GenreRepository genreRepository;

    @Autowired
    private LanguageRepository languageRepository;

    @Autowired
    private LoanRepository loanRepository;

    private MockHttpSession admin;
    private long fantasyId;
    private long englishId;

    @BeforeEach
    void setUp() throws Exception {
        admin = signUpAndLogin("admin@example.com");
        fantasyId = genreId("Fantasy");
        englishId = languageRepository.findAll().stream()
                .filter(l -> l.getName().equals("English")).findFirst().orElseThrow().getId();
    }

    @Test
    void listShape() throws Exception {
        mockMvc.perform(get("/api/books").session(admin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.books.length()").value(10))
                .andExpect(jsonPath("$.page").value(0))
                .andExpect(jsonPath("$.totalPages").value(1))
                .andExpect(jsonPath("$.total").value(10))
                .andExpect(jsonPath("$.books[0].title").value("Cien años de soledad"))
                .andExpect(jsonPath("$.books[0].genre.name").value("Literary Fiction"))
                .andExpect(jsonPath("$.books[0].language.name").value("Spanish"))
                .andExpect(jsonPath("$.books[0].amount").value(4))
                .andExpect(jsonPath("$.books[0].stock").value(4))
                .andExpect(jsonPath("$.filters.isbn.length()").value(10))
                .andExpect(jsonPath("$.filters.title.length()").value(10))
                .andExpect(jsonPath("$.filters.author.length()").value(10))
                .andExpect(jsonPath("$.filters.genre.length()").value(24))
                .andExpect(jsonPath("$.filters.language.length()").value(17))
                .andExpect(jsonPath("$.filters.amount[0]").value(2))
                .andExpect(jsonPath("$.filters.stock").isArray());
    }

    @Test
    void pagingClampsToLastPage() throws Exception {
        create(DUNE.replace("978", "979"), "Zzz", 1).andExpect(status().isCreated());

        mockMvc.perform(get("/api/books").param("page", "5").session(admin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.page").value(1))
                .andExpect(jsonPath("$.totalPages").value(2))
                .andExpect(jsonPath("$.total").value(11))
                .andExpect(jsonPath("$.books.length()").value(1))
                .andExpect(jsonPath("$.books[0].title").value("Zzz"));
    }

    @Test
    void filtersAreExactAndCombined() throws Exception {
        mockMvc.perform(get("/api/books").param("title", "Dune").session(admin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.books.length()").value(1))
                .andExpect(jsonPath("$.books[0].isbn").value(DUNE));

        long literary = genreId("Literary Fiction");
        mockMvc.perform(get("/api/books").param("genreId", String.valueOf(literary)).session(admin))
                .andExpect(jsonPath("$.total").value(3));

        mockMvc.perform(get("/api/books").param("genreId", String.valueOf(literary)).param("amount", "4")
                        .session(admin))
                .andExpect(jsonPath("$.total").value(1))
                .andExpect(jsonPath("$.books[0].author").value("Gabriel García Márquez"));
    }

    @Test
    void invalidPageSizeOrSortIsBadRequest() throws Exception {
        mockMvc.perform(get("/api/books").param("size", "15").session(admin))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Invalid page size"));
        mockMvc.perform(get("/api/books").param("sort", "price").session(admin))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Invalid sort"));
        mockMvc.perform(get("/api/books").param("sort", "title").param("dir", "up").session(admin))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Invalid sort"));
        mockMvc.perform(get("/api/books").param("page", "abc").session(admin))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Invalid request"));
    }

    @Test
    void sortsByColumnAndJoinedName() throws Exception {
        mockMvc.perform(get("/api/books").param("sort", "author").param("dir", "desc").session(admin))
                .andExpect(jsonPath("$.books[0].author").value("Yuval Noah Harari"))
                .andExpect(jsonPath("$.books[9].author").value("Agatha Christie"));
        mockMvc.perform(get("/api/books").param("sort", "genre").param("dir", "asc").session(admin))
                .andExpect(jsonPath("$.books[0].genre.name").value("Children's"))
                .andExpect(jsonPath("$.books[9].genre.name").value("Thriller"));
        mockMvc.perform(get("/api/books").param("sort", "language").param("dir", "desc").session(admin))
                .andExpect(jsonPath("$.books[0].language.name").value("Spanish"));
    }

    @Test
    void createAndDuplicate() throws Exception {
        create("111", "  New Book ", 3)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.isbn").value("111"))
                .andExpect(jsonPath("$.title").value("New Book"))
                .andExpect(jsonPath("$.genre.id").value(fantasyId))
                .andExpect(jsonPath("$.amount").value(3))
                .andExpect(jsonPath("$.stock").value(3));

        create("111", "Other", 1)
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("ISBN already exists"));

        mockMvc.perform(get("/api/books/{isbn}", "111").session(admin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("New Book"));
        mockMvc.perform(get("/api/books/{isbn}", "nope").session(admin))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Book not found"));
    }

    @Test
    void createRejectsInvalidBody() throws Exception {
        create("", "Title", 1).andExpect(status().isBadRequest());
        create("222", "Title", -1).andExpect(status().isBadRequest());
        send(post("/api/books"), body("333", "Title", 999999L, englishId, 1))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Unknown genre"));
    }

    @Test
    void updateRecomputesStockFromOpenLoans() throws Exception {
        openLoan(DUNE);

        send(put("/api/books/{isbn}", DUNE), body(DUNE, "Dune Messiah", fantasyId, englishId, 5))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Dune Messiah"))
                .andExpect(jsonPath("$.genre.name").value("Fantasy"))
                .andExpect(jsonPath("$.amount").value(5))
                .andExpect(jsonPath("$.stock").value(4));
    }

    @Test
    void amountBelowOpenLoansIsBadRequest() throws Exception {
        openLoan(DUNE);

        send(put("/api/books/{isbn}", DUNE), body(DUNE, "Dune", fantasyId, englishId, 0))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Amount is below copies on loan"));
    }

    @Test
    void amountBelowLoansAndReservationsIsBadRequest() throws Exception {
        openLoan(DUNE);
        User user = userRepository.findByEmail("admin@example.com").orElseThrow();
        Instant now = Instant.now();
        loanRepository.save(Loan.reserved(user, bookRepository.findById(DUNE).orElseThrow(), now,
                now.plus(Duration.ofDays(LoanService.RESERVE_DAYS))));

        send(put("/api/books/{isbn}", DUNE), body(DUNE, "Dune", fantasyId, englishId, 1))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Amount is below copies on loan"));
        send(put("/api/books/{isbn}", DUNE), body(DUNE, "Dune", fantasyId, englishId, 2))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.stock").value(0));
    }

    @Test
    void updateIsbnRepointsLoans() throws Exception {
        Loan loan = openLoan(DUNE);

        send(put("/api/books/{isbn}", DUNE), body("123", "Dune", fantasyId, englishId, 3))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isbn").value("123"))
                .andExpect(jsonPath("$.stock").value(2));

        assertThat(loanRepository.findById(loan.getId()).orElseThrow().getBook().getIsbn()).isEqualTo("123");
        assertThat(bookRepository.existsById(DUNE)).isFalse();
    }

    @Test
    void updateToExistingIsbnIsConflict() throws Exception {
        send(put("/api/books/{isbn}", DUNE), body(KOKORO, "Dune", fantasyId, englishId, 3))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("ISBN already exists"));
    }

    @Test
    void mergeSumsAmountAndRepointsLoans() throws Exception {
        Loan loan = openLoan(DUNE);
        openLoan(KOKORO);

        send(post("/api/books/{isbn}/merge", DUNE), body(KOKORO, "Kokoro", fantasyId, englishId, 5))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isbn").value(KOKORO))
                .andExpect(jsonPath("$.title").value("Kokoro"))
                .andExpect(jsonPath("$.genre.name").value("Fantasy"))
                .andExpect(jsonPath("$.amount").value(5))
                .andExpect(jsonPath("$.stock").value(3));

        assertThat(loanRepository.findById(loan.getId()).orElseThrow().getBook().getIsbn()).isEqualTo(KOKORO);
        assertThat(bookRepository.existsById(DUNE)).isFalse();

        send(post("/api/books/{isbn}/merge", KOKORO), body(KOKORO, "Kokoro", fantasyId, englishId, 5))
                .andExpect(status().isBadRequest());
        send(post("/api/books/{isbn}/merge", KOKORO), body("missing", "Kokoro", fantasyId, englishId, 5))
                .andExpect(status().isBadRequest());
    }

    @Test
    void deleteBook() throws Exception {
        mockMvc.perform(delete("/api/books/{isbn}", DUNE).session(admin))
                .andExpect(status().isNoContent());
        assertThat(bookRepository.existsById(DUNE)).isFalse();

        mockMvc.perform(delete("/api/books/{isbn}", DUNE).session(admin))
                .andExpect(status().isNotFound());
    }

    @Test
    void deleteWithLoansIsConflict() throws Exception {
        Loan loan = openLoan(KOKORO);
        loan.setReturnedAt(Instant.now());

        mockMvc.perform(delete("/api/books/{isbn}", KOKORO).session(admin))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Book has loan records"));
    }

    @Test
    void nonAdminIsForbiddenAndAnonymousUnauthorized() throws Exception {
        MockHttpSession user = signUpAndLogin("ada@example.com");
        String json = body(DUNE, "Dune", fantasyId, englishId, 3);

        mockMvc.perform(get("/api/books").session(user)).andExpect(status().isForbidden());
        mockMvc.perform(get("/api/books/{isbn}", DUNE).session(user)).andExpect(status().isForbidden());
        mockMvc.perform(post("/api/books").session(user).contentType(MediaType.APPLICATION_JSON).content(json))
                .andExpect(status().isForbidden());
        mockMvc.perform(put("/api/books/{isbn}", DUNE).session(user).contentType(MediaType.APPLICATION_JSON)
                .content(json)).andExpect(status().isForbidden());
        mockMvc.perform(post("/api/books/{isbn}/merge", KOKORO).session(user)
                .contentType(MediaType.APPLICATION_JSON).content(json)).andExpect(status().isForbidden());
        mockMvc.perform(delete("/api/books/{isbn}", DUNE).session(user)).andExpect(status().isForbidden());

        mockMvc.perform(get("/api/books")).andExpect(status().isUnauthorized());
    }

    private ResultActions create(String isbn, String title, int amount) throws Exception {
        return send(post("/api/books"), body(isbn, title, fantasyId, englishId, amount));
    }

    private ResultActions send(MockHttpServletRequestBuilder request, String json) throws Exception {
        return mockMvc.perform(request.session(admin).contentType(MediaType.APPLICATION_JSON).content(json));
    }

    private static String body(String isbn, String title, long genreId, long languageId, int amount) {
        return """
                {"isbn": "%s", "title": "%s", "author": "Someone", "genreId": %d, "languageId": %d, "amount": %d}
                """.formatted(isbn, title, genreId, languageId, amount);
    }

    private long genreId(String name) {
        return genreRepository.findAll().stream()
                .filter(g -> g.getName().equals(name)).findFirst().orElseThrow().getId();
    }

    private Loan openLoan(String isbn) {
        User user = userRepository.findByEmail("admin@example.com").orElseThrow();
        Instant now = Instant.now();
        return loanRepository.save(new Loan(user, bookRepository.findById(isbn).orElseThrow(), now,
                now.plus(Duration.ofDays(LoanService.LOAN_DAYS))));
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
