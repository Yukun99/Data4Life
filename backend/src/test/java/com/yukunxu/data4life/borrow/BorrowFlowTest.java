package com.yukunxu.data4life.borrow;

import static org.assertj.core.api.Assertions.assertThat;
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
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class BorrowFlowTest {

    private static final String SAPIENS = "9780062316097";
    private static final String CHRISTIE = "9780062693662";
    private static final String DUNE = "9780441172719";
    private static final String KOKORO = "9784101010137";
    private static final List<String> OTHERS = List.of("9780141439518", "9780261103573", "9780307474278",
            "9782070612758", "9787020002207", "9788497592208", SAPIENS);
    private static final String COLUMNS = """
            {"isbn": 16, "titleAuthor": 36, "genreLanguage": 20, "stock": 10, "actions": 18}
            """;

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BookRepository bookRepository;

    @Autowired
    private LoanRepository loanRepository;

    private MockHttpSession session;
    private User user;

    @BeforeEach
    void setUp() throws Exception {
        session = signUpAndLogin("ada@example.com");
        user = userRepository.findByEmail("ada@example.com").orElseThrow();
    }

    @Test
    void listShowsHoldingsAndNoBlock() throws Exception {
        borrow(SAPIENS).andExpect(status().isOk());
        reserve(CHRISTIE).andExpect(status().isOk());

        mockMvc.perform(get("/api/borrow").param("sort", "isbn").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.books.length()").value(10))
                .andExpect(jsonPath("$.page").value(0))
                .andExpect(jsonPath("$.totalPages").value(1))
                .andExpect(jsonPath("$.total").value(10))
                .andExpect(jsonPath("$.books[0].isbn").value(SAPIENS))
                .andExpect(jsonPath("$.books[0].title").value("Sapiens: A Brief History of Humankind"))
                .andExpect(jsonPath("$.books[0].author").value("Yuval Noah Harari"))
                .andExpect(jsonPath("$.books[0].genre.name").value("History"))
                .andExpect(jsonPath("$.books[0].language.name").value("English"))
                .andExpect(jsonPath("$.books[0].stock").value(4))
                .andExpect(jsonPath("$.books[0].amount").doesNotExist())
                .andExpect(jsonPath("$.books[0].holding").value("BORROWED"))
                .andExpect(jsonPath("$.books[1].isbn").value(CHRISTIE))
                .andExpect(jsonPath("$.books[1].stock").value(4))
                .andExpect(jsonPath("$.books[1].holding").value("RESERVED"))
                .andExpect(jsonPath("$.books[2].holding").isEmpty())
                .andExpect(jsonPath("$.filters.isbn.length()").value(10))
                .andExpect(jsonPath("$.block").isEmpty());

        mockMvc.perform(get("/api/borrow").param("isbn", DUNE).session(session))
                .andExpect(jsonPath("$.total").value(1))
                .andExpect(jsonPath("$.books[0].isbn").value(DUNE));
    }

    @Test
    void borrowTakesACopy() throws Exception {
        borrow(DUNE).andExpect(status().isOk())
                .andExpect(jsonPath("$.isbn").value(DUNE))
                .andExpect(jsonPath("$.stock").value(2))
                .andExpect(jsonPath("$.holding").value("BORROWED"));
        assertThat(bookRepository.findById(DUNE).orElseThrow().getStock()).isEqualTo(2);

        mockMvc.perform(get("/api/loans").session(session))
                .andExpect(jsonPath("$.loans.length()").value(1))
                .andExpect(jsonPath("$.loans[0].isbn").value(DUNE))
                .andExpect(jsonPath("$.loans[0].status").value("BORROWED"))
                .andExpect(jsonPath("$.loans[0].reservedAt").isEmpty())
                .andExpect(jsonPath("$.loans[0].fee").value(0.0))
                .andExpect(jsonPath("$.stats.booksBorrowed").value(1));

        borrow(DUNE).andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("You already have this book on loan"));
        reserve(DUNE).andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("You already have this book on loan"));
        assertThat(bookRepository.findById(DUNE).orElseThrow().getStock()).isEqualTo(2);
    }

    @Test
    void outOfStockAndUnknownBook() throws Exception {
        bookRepository.findById(KOKORO).orElseThrow().setStock(0);

        borrow(KOKORO).andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Out of stock"));
        reserve(KOKORO).andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Out of stock"));
        borrow("missing").andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Book not found"));
        reserve("missing").andExpect(status().isNotFound());
        assertThat(loanRepository.existsByUser(user)).isFalse();
    }

    @Test
    void reserveHoldsACopyForAWeek() throws Exception {
        Instant before = Instant.now();
        reserve(DUNE).andExpect(status().isOk())
                .andExpect(jsonPath("$.stock").value(2))
                .andExpect(jsonPath("$.holding").value("RESERVED"));

        mockMvc.perform(get("/api/loans").session(session))
                .andExpect(jsonPath("$.loans.length()").value(1))
                .andExpect(jsonPath("$.loans[0].status").value("RESERVED"))
                .andExpect(jsonPath("$.loans[0].fee").value(5.0))
                .andExpect(jsonPath("$.loans[0].fine").value(0.0))
                .andExpect(jsonPath("$.loans[0].borrowedAt").isEmpty())
                .andExpect(jsonPath("$.loans[0].dueAt").isEmpty())
                .andExpect(jsonPath("$.loans[0].reservedAt").isString())
                .andExpect(jsonPath("$.loans[0].reservedUntil").isString())
                .andExpect(jsonPath("$.stats.booksBorrowed").value(0))
                .andExpect(jsonPath("$.stats.totalOverdueFines").value(0.0));
        assertThat(onlyLoan().getReservedUntil()).isBetween(before.plus(days(LoanService.RESERVE_DAYS)),
                Instant.now().plus(days(LoanService.RESERVE_DAYS)));

        reserve(DUNE).andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("You already reserved this book"));
        assertThat(bookRepository.findById(DUNE).orElseThrow().getStock()).isEqualTo(2);
    }

    @Test
    void borrowingAReservedBookConvertsIt() throws Exception {
        reserve(DUNE).andExpect(status().isOk());

        borrow(DUNE).andExpect(status().isOk())
                .andExpect(jsonPath("$.stock").value(2))
                .andExpect(jsonPath("$.holding").value("BORROWED"));

        mockMvc.perform(get("/api/loans").session(session))
                .andExpect(jsonPath("$.loans.length()").value(1))
                .andExpect(jsonPath("$.loans[0].status").value("BORROWED"))
                .andExpect(jsonPath("$.loans[0].dueAt").isString())
                .andExpect(jsonPath("$.loans[0].fee").value(5.0))
                .andExpect(jsonPath("$.stats.booksBorrowed").value(1));
        assertThat(bookRepository.findById(DUNE).orElseThrow().getStock()).isEqualTo(2);
    }

    @Test
    void expiredReservationReleasesTheCopy() throws Exception {
        reserve(DUNE).andExpect(status().isOk());
        onlyLoan().setReservedUntil(Instant.now().minus(Duration.ofHours(1)));

        mockMvc.perform(get("/api/borrow").param("isbn", DUNE).session(session))
                .andExpect(jsonPath("$.books[0].stock").value(3))
                .andExpect(jsonPath("$.books[0].holding").isEmpty());
        mockMvc.perform(get("/api/borrow").param("isbn", DUNE).session(session))
                .andExpect(jsonPath("$.books[0].stock").value(3));
        mockMvc.perform(get("/api/loans").session(session))
                .andExpect(jsonPath("$.loans[0].status").value("EXPIRED"))
                .andExpect(jsonPath("$.loans[0].fee").value(5.0));
        assertThat(onlyLoan().getReleasedAt()).isNotNull();

        reserve(DUNE).andExpect(status().isOk())
                .andExpect(jsonPath("$.stock").value(2));
        mockMvc.perform(get("/api/loans").session(session))
                .andExpect(jsonPath("$.loans.length()").value(2))
                .andExpect(jsonPath("$.loans[0].status").value("RESERVED"))
                .andExpect(jsonPath("$.loans[1].status").value("EXPIRED"));
    }

    @Test
    void invalidSortOrSizeIsBadRequest() throws Exception {
        mockMvc.perform(get("/api/borrow").param("sort", "amount").session(session))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Invalid sort"));
        mockMvc.perform(get("/api/borrow").param("size", "15").session(session))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Invalid page size"));
    }

    @Test
    void unpaidFineBlocks() throws Exception {
        Instant now = Instant.now();
        loan(KOKORO, now.minus(days(40))).setReturnedAt(now.minus(days(20)));

        expectBlocked("You have unpaid fines");
    }

    @Test
    void overdueBookBlocks() throws Exception {
        loan(KOKORO, Instant.now().minus(days(20)));

        expectBlocked("You have an overdue book");
    }

    @Test
    void holdingEightBooksBlocksNewRowsButNotAConversion() throws Exception {
        reserve(DUNE).andExpect(status().isOk());
        for (String isbn : OTHERS) {
            borrow(isbn).andExpect(status().isOk());
        }

        mockMvc.perform(get("/api/borrow").session(session))
                .andExpect(jsonPath("$.block").value("You already hold 8 books"))
                .andExpect(jsonPath("$.convertBlock").isEmpty());
        borrow(KOKORO).andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("You already hold 8 books"));
        reserve(KOKORO).andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("You already hold 8 books"));
        borrow(DUNE).andExpect(status().isOk())
                .andExpect(jsonPath("$.holding").value("BORROWED"));
    }

    @Test
    void columnWidthsPersistPerUser() throws Exception {
        mockMvc.perform(get("/api/borrow/columns").session(session))
                .andExpect(status().isOk())
                .andExpect(content().string(""));

        send(put("/api/borrow/columns"), COLUMNS)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.titleAuthor").value(36.0));

        mockMvc.perform(get("/api/borrow/columns").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isbn").value(16.0))
                .andExpect(jsonPath("$.actions").value(18.0));
        assertThat(user.getBorrowColumns()).isEqualTo("16.0,36.0,20.0,10.0,18.0");

        send(put("/api/borrow/columns"), COLUMNS.replace("36", "40"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Column widths must total 100"));
        send(put("/api/borrow/columns"), COLUMNS.replace("\"stock\": 10", "\"stock\": 4").replace("36", "42"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void withoutSessionIsUnauthorized() throws Exception {
        MockHttpServletRequestBuilder[] routes = {
            get("/api/borrow"),
            post("/api/borrow/{isbn}", DUNE),
            post("/api/borrow/{isbn}/reserve", DUNE),
            get("/api/borrow/columns"),
            put("/api/borrow/columns"),
        };
        for (MockHttpServletRequestBuilder request : routes) {
            mockMvc.perform(request.contentType(MediaType.APPLICATION_JSON).content(COLUMNS))
                    .andExpect(status().isUnauthorized());
        }
    }

    private void expectBlocked(String reason) throws Exception {
        mockMvc.perform(get("/api/borrow").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.block").value(reason))
                .andExpect(jsonPath("$.convertBlock").value(reason));
        borrow(DUNE).andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value(reason));
        reserve(DUNE).andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value(reason));
        assertThat(bookRepository.findById(DUNE).orElseThrow().getStock()).isEqualTo(3);
    }

    private ResultActions borrow(String isbn) throws Exception {
        return mockMvc.perform(post("/api/borrow/{isbn}", isbn).session(session));
    }

    private ResultActions reserve(String isbn) throws Exception {
        return mockMvc.perform(post("/api/borrow/{isbn}/reserve", isbn).session(session));
    }

    private ResultActions send(MockHttpServletRequestBuilder request, String json) throws Exception {
        return mockMvc.perform(request.session(session).contentType(MediaType.APPLICATION_JSON).content(json));
    }

    private Loan loan(String isbn, Instant borrowedAt) {
        return loanRepository.save(new Loan(user, bookRepository.findById(isbn).orElseThrow(), borrowedAt,
                borrowedAt.plus(days(LoanService.LOAN_DAYS))));
    }

    private Loan onlyLoan() {
        List<Loan> loans = loanRepository.findByUserNewestFirst(user);
        assertThat(loans).hasSize(1);
        return loans.getFirst();
    }

    private static Duration days(long days) {
        return Duration.ofDays(days);
    }

    private MockHttpSession signUpAndLogin(String email) throws Exception {
        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name": "Ada", "email": "%s", "password": "secret123"}
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
