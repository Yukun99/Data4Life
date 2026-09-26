package com.yukunxu.data4life.loan;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.yukunxu.data4life.catalogue.BookRepository;
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
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class LoanFlowTest {

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
    private Loan unpaid;
    private Loan borrowed;

    @BeforeEach
    void setUp() throws Exception {
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
        user = userRepository.findByEmail("ada@example.com").orElseThrow();

        Instant now = Instant.now();
        borrowed = loan("9780062316097", now.minus(Duration.ofDays(3)), null);
        unpaid = loan("9780062693662", now.minus(Duration.ofDays(40)), now.minus(Duration.ofDays(20)));
        loan("9780141439518", now.minus(Duration.ofDays(45)), now.minus(Duration.ofDays(29)));
    }

    @Test
    void historyShape() throws Exception {
        mockMvc.perform(get("/api/loans").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.stats.booksBorrowed").value(3))
                .andExpect(jsonPath("$.stats.favouriteGenre").value("History"))
                .andExpect(jsonPath("$.stats.favouriteAuthor").value("Agatha Christie"))
                .andExpect(jsonPath("$.stats.totalOverdueFines").value(8.0))
                .andExpect(jsonPath("$.loans.length()").value(3))
                .andExpect(jsonPath("$.loans[0].id").value(borrowed.getId()))
                .andExpect(jsonPath("$.loans[0].isbn").value("9780062316097"))
                .andExpect(jsonPath("$.loans[0].title").value("Sapiens: A Brief History of Humankind"))
                .andExpect(jsonPath("$.loans[0].author").value("Yuval Noah Harari"))
                .andExpect(jsonPath("$.loans[0].genre").value("History"))
                .andExpect(jsonPath("$.loans[0].borrowedAt").isString())
                .andExpect(jsonPath("$.loans[0].dueAt").isString())
                .andExpect(jsonPath("$.loans[0].returnedAt").isEmpty())
                .andExpect(jsonPath("$.loans[0].status").value("BORROWED"))
                .andExpect(jsonPath("$.loans[0].overdueDays").value(0))
                .andExpect(jsonPath("$.loans[1].status").value("UNPAID"))
                .andExpect(jsonPath("$.loans[1].overdueDays").value(6))
                .andExpect(jsonPath("$.loans[1].fine").value(6.0));
    }

    @Test
    void payOneReturnsRefreshedHistory() throws Exception {
        mockMvc.perform(post("/api/loans/{id}/pay", unpaid.getId()).session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.loans[1].status").value("PAID"))
                .andExpect(jsonPath("$.loans[2].status").value("UNPAID"))
                .andExpect(jsonPath("$.stats.totalOverdueFines").value(2.0));

        mockMvc.perform(post("/api/loans/{id}/pay", borrowed.getId()).session(session))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("This loan has no unpaid fine"));

        mockMvc.perform(post("/api/loans/{id}/pay", 999999).session(session))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Loan not found"));
    }

    @Test
    void payAllReturnsRefreshedHistory() throws Exception {
        mockMvc.perform(post("/api/loans/pay-all").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.loans[0].status").value("BORROWED"))
                .andExpect(jsonPath("$.loans[1].status").value("PAID"))
                .andExpect(jsonPath("$.loans[2].status").value("PAID"))
                .andExpect(jsonPath("$.stats.totalOverdueFines").value(0.0));
    }

    @Test
    void withoutSessionIsUnauthorized() throws Exception {
        mockMvc.perform(get("/api/loans")).andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/loans/pay-all")).andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/loans/{id}/pay", unpaid.getId())).andExpect(status().isUnauthorized());
    }

    private Loan loan(String isbn, Instant borrowedAt, Instant returnedAt) {
        Loan loan = new Loan(user, bookRepository.findById(isbn).orElseThrow(), borrowedAt,
                borrowedAt.plus(Duration.ofDays(LoanService.LOAN_DAYS)));
        loan.setReturnedAt(returnedAt);
        return loanRepository.save(loan);
    }
}
