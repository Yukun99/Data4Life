package com.yukunxu.data4life.returns;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.yukunxu.data4life.catalogue.Book;
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
class ReturnFlowTest {

    private static final String SAPIENS = "9780062316097";
    private static final String CHRISTIE = "9780062693662";
    private static final String AUSTEN = "9780141439518";
    private static final String TOLKIEN = "9780261103573";
    private static final String BROWN = "9780307474278";
    private static final String DUNE = "9780441172719";
    private static final String KOKORO = "9784101010137";
    private static final String COLUMNS = """
            {"isbn": 14, "titleAuthor": 30, "genreLanguage": 18, "status": 20, "actions": 18}
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
    private Instant now;

    @BeforeEach
    void setUp() throws Exception {
        session = signUpAndLogin("ada@example.com");
        user = userRepository.findByEmail("ada@example.com").orElseThrow();
        now = Instant.now();
    }

    @Test
    void listShowsOpenOverdueAndUnpaidLoans() throws Exception {
        Loan open = loan(user, DUNE, now.minus(days(2)));
        Loan overdue = overdue(KOKORO);
        Loan unpaid = loan(user, SAPIENS, now.minus(days(40)));
        unpaid.setReturnedAt(now.minus(days(20)));
        loan(user, CHRISTIE, now.minus(days(30))).setReturnedAt(now.minus(days(20)));
        Loan paid = loan(user, AUSTEN, now.minus(days(40)));
        paid.setReturnedAt(now.minus(days(20)));
        paid.setFinePaidAt(now.minus(days(19)));
        Loan forgiven = loan(user, TOLKIEN, now.minus(days(40)));
        forgiven.setReturnedAt(now.minus(days(20)));
        forgiven.setFineForgivenAt(now.minus(days(19)));
        Loan reserved = loanRepository.save(
                Loan.reserved(user, book(BROWN), now, now.plus(days(LoanService.RESERVE_DAYS))));
        Loan expired = loanRepository.save(Loan.reserved(user, book(CHRISTIE), now.minus(days(9)),
                now.minus(days(2))));

        list()
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.loans.length()").value(4))
                .andExpect(jsonPath("$.page").value(0))
                .andExpect(jsonPath("$.totalPages").value(1))
                .andExpect(jsonPath("$.total").value(4))
                .andExpect(jsonPath("$.totalUnpaid").value(6.0))
                .andExpect(jsonPath("$.loans[0].id").value(unpaid.getId()))
                .andExpect(jsonPath("$.loans[0].status").value("UNPAID"))
                .andExpect(jsonPath("$.loans[0].returnedAt").isString())
                .andExpect(jsonPath("$.loans[0].overdueDays").value(6))
                .andExpect(jsonPath("$.loans[0].fine").value(6.0))
                .andExpect(jsonPath("$.loans[0].genre.name").value("History"))
                .andExpect(jsonPath("$.loans[0].language.name").value("English"))
                .andExpect(jsonPath("$.loans[1].id").value(overdue.getId()))
                .andExpect(jsonPath("$.loans[1].status").value("OVERDUE"))
                .andExpect(jsonPath("$.loans[1].overdueDays").value(6))
                .andExpect(jsonPath("$.loans[1].fine").value(6.0))
                .andExpect(jsonPath("$.loans[2].id").value(reserved.getId()))
                .andExpect(jsonPath("$.loans[2].isbn").value(BROWN))
                .andExpect(jsonPath("$.loans[2].status").value("RESERVED"))
                .andExpect(jsonPath("$.loans[2].dueAt").isEmpty())
                .andExpect(jsonPath("$.loans[2].reservedUntil").isString())
                .andExpect(jsonPath("$.loans[2].overdueDays").value(0))
                .andExpect(jsonPath("$.loans[2].fine").value(0.0))
                .andExpect(jsonPath("$.loans[3].id").value(open.getId()))
                .andExpect(jsonPath("$.loans[3].isbn").value(DUNE))
                .andExpect(jsonPath("$.loans[3].title").value("Dune"))
                .andExpect(jsonPath("$.loans[3].author").value("Frank Herbert"))
                .andExpect(jsonPath("$.loans[3].status").value("BORROWED"))
                .andExpect(jsonPath("$.loans[3].dueAt").isString())
                .andExpect(jsonPath("$.loans[3].returnedAt").isEmpty())
                .andExpect(jsonPath("$.loans[3].fine").value(0.0))
                .andExpect(jsonPath("$.filters.isbn.length()").value(4))
                .andExpect(jsonPath("$.filters.isbn[0]").value(SAPIENS))
                .andExpect(jsonPath("$.filters.title[0]").value("Dune"))
                .andExpect(jsonPath("$.filters.author[0]").value("Dan Brown"))
                .andExpect(jsonPath("$.filters.genre.length()").value(4))
                .andExpect(jsonPath("$.filters.genre[0].name").value("History"))
                .andExpect(jsonPath("$.filters.genre[1].name").value("Literary Fiction"))
                .andExpect(jsonPath("$.filters.genre[2].name").value("Science Fiction"))
                .andExpect(jsonPath("$.filters.genre[3].name").value("Thriller"))
                .andExpect(jsonPath("$.filters.language.length()").value(2))
                .andExpect(jsonPath("$.filters.language[0].name").value("English"))
                .andExpect(jsonPath("$.filters.language[1].name").value("Japanese"));
        assertThat(expired.getReleasedAt()).isNotNull();
    }

    @Test
    void unreservePutsTheCopyBack() throws Exception {
        Loan reserved = loanRepository.save(
                Loan.reserved(user, book(BROWN), now, now.plus(days(LoanService.RESERVE_DAYS))));
        book(BROWN).setStock(1);

        unreserve(reserved.getId())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(reserved.getId()))
                .andExpect(jsonPath("$.status").value("EXPIRED"))
                .andExpect(jsonPath("$.fine").value(0.0));
        assertThat(book(BROWN).getStock()).isEqualTo(2);
        assertThat(reserved.getReleasedAt()).isNotNull();
        list().andExpect(jsonPath("$.total").value(0));

        unreserve(reserved.getId())
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("This reservation has already ended"));
        assertThat(book(BROWN).getStock()).isEqualTo(2);

        Loan loan = loan(user, DUNE, now.minus(days(2)));
        unreserve(loan.getId())
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("This is not a reservation"));
        unreserve(999999L).andExpect(status().isNotFound());
    }

    @Test
    void sortFilterAndPageClamp() throws Exception {
        loan(user, DUNE, now.minus(days(2)));
        overdue(KOKORO);
        loan(user, SAPIENS, now.minus(days(40))).setReturnedAt(now.minus(days(20)));

        list("sort", "title")
                .andExpect(jsonPath("$.loans[0].isbn").value(DUNE))
                .andExpect(jsonPath("$.loans[1].isbn").value(KOKORO))
                .andExpect(jsonPath("$.loans[2].isbn").value(SAPIENS));
        list("sort", "due", "dir", "desc")
                .andExpect(jsonPath("$.loans[0].isbn").value(DUNE))
                .andExpect(jsonPath("$.loans[2].isbn").value(SAPIENS));
        list("genreId", String.valueOf(book(KOKORO).getGenre().getId()))
                .andExpect(jsonPath("$.total").value(1))
                .andExpect(jsonPath("$.loans[0].isbn").value(KOKORO))
                .andExpect(jsonPath("$.filters.genre.length()").value(3))
                .andExpect(jsonPath("$.totalUnpaid").value(6.0));
        list("page", "5")
                .andExpect(jsonPath("$.page").value(0))
                .andExpect(jsonPath("$.loans.length()").value(3));
    }

    @Test
    void invalidSortOrSizeIsBadRequest() throws Exception {
        list("sort", "stock")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Invalid sort"));
        list("dir", "up").andExpect(status().isBadRequest());
        list("size", "15")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Invalid page size"));
    }

    @Test
    void returnPutsTheCopyBack() throws Exception {
        Loan loan = loan(user, DUNE, now.minus(days(2)));
        book(DUNE).setStock(2);

        returnLoan(loan.getId())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(loan.getId()))
                .andExpect(jsonPath("$.status").value("RETURNED"))
                .andExpect(jsonPath("$.returnedAt").isString())
                .andExpect(jsonPath("$.fine").value(0.0));
        assertThat(book(DUNE).getStock()).isEqualTo(3);
        assertThat(loan.getReturnedAt()).isNotNull();
        list().andExpect(jsonPath("$.total").value(0));

        returnLoan(loan.getId())
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("This book was already returned"));
        assertThat(book(DUNE).getStock()).isEqualTo(3);
    }

    @Test
    void returningAnOverdueBookMakesTheFinePayable() throws Exception {
        Loan loan = overdue(KOKORO);
        book(KOKORO).setStock(1);

        returnLoan(loan.getId())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UNPAID"))
                .andExpect(jsonPath("$.overdueDays").value(6))
                .andExpect(jsonPath("$.fine").value(6.0));
        assertThat(book(KOKORO).getStock()).isEqualTo(2);
        list()
                .andExpect(jsonPath("$.total").value(1))
                .andExpect(jsonPath("$.loans[0].status").value("UNPAID"))
                .andExpect(jsonPath("$.totalUnpaid").value(6.0));
    }

    @Test
    void reservationsAndOtherUsersLoansCannotBeReturned() throws Exception {
        Loan reserved = loanRepository.save(
                Loan.reserved(user, book(DUNE), now, now.plus(days(LoanService.RESERVE_DAYS))));
        returnLoan(reserved.getId())
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("This is a reservation"));

        signUpAndLogin("bob@example.com");
        User bob = userRepository.findByEmail("bob@example.com").orElseThrow();
        Loan other = loan(bob, KOKORO, now.minus(days(2)));
        returnLoan(other.getId())
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Loan not found"));
        assertThat(other.getReturnedAt()).isNull();
        returnLoan(999999L).andExpect(status().isNotFound());
    }

    @Test
    void columnWidthsPersistPerUser() throws Exception {
        mockMvc.perform(get("/api/return/columns").session(session))
                .andExpect(status().isOk())
                .andExpect(content().string(""));

        send(put("/api/return/columns"), COLUMNS)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(20.0));

        mockMvc.perform(get("/api/return/columns").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isbn").value(14.0))
                .andExpect(jsonPath("$.actions").value(18.0));
        assertThat(user.getReturnColumns()).isEqualTo("14.0,30.0,18.0,20.0,18.0");

        send(put("/api/return/columns"), COLUMNS.replace("30", "40"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Column widths must total 100"));
        send(put("/api/return/columns"), COLUMNS.replace("\"status\": 20", "\"status\": 4").replace("30", "46"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void withoutSessionIsUnauthorized() throws Exception {
        MockHttpServletRequestBuilder[] routes = {
            get("/api/return"),
            post("/api/return/{loanId}", 1),
            post("/api/return/{loanId}/unreserve", 1),
            get("/api/return/columns"),
            put("/api/return/columns"),
        };
        for (MockHttpServletRequestBuilder request : routes) {
            mockMvc.perform(request.contentType(MediaType.APPLICATION_JSON).content(COLUMNS))
                    .andExpect(status().isUnauthorized());
        }
    }

    private ResultActions list(String... params) throws Exception {
        MockHttpServletRequestBuilder request = get("/api/return").session(session);
        for (int i = 0; i < params.length; i += 2) {
            request.param(params[i], params[i + 1]);
        }
        return mockMvc.perform(request);
    }

    private ResultActions returnLoan(Long id) throws Exception {
        return mockMvc.perform(post("/api/return/{loanId}", id).session(session));
    }

    private ResultActions unreserve(Long id) throws Exception {
        return mockMvc.perform(post("/api/return/{loanId}/unreserve", id).session(session));
    }

    private ResultActions send(MockHttpServletRequestBuilder request, String json) throws Exception {
        return mockMvc.perform(request.session(session).contentType(MediaType.APPLICATION_JSON).content(json));
    }

    /** Six whole days overdue: due an hour less than six days ago. */
    private Loan overdue(String isbn) {
        return loan(user, isbn, now.minus(days(20)).plus(Duration.ofHours(1)));
    }

    private Loan loan(User owner, String isbn, Instant borrowedAt) {
        return loanRepository.save(new Loan(owner, book(isbn), borrowedAt,
                borrowedAt.plus(days(LoanService.LOAN_DAYS))));
    }

    private Book book(String isbn) {
        return bookRepository.findById(isbn).orElseThrow();
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
