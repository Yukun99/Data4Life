package com.yukunxu.data4life.loan;

import static org.assertj.core.api.Assertions.assertThat;

import com.yukunxu.data4life.catalogue.Book;
import com.yukunxu.data4life.catalogue.BookRepository;
import com.yukunxu.data4life.user.User;
import com.yukunxu.data4life.user.UserRepository;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Sort;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class LoanSeederTest {

    @Autowired
    private LoanSeeder seeder;

    @Autowired
    private LoanService loanService;

    @Autowired
    private LoanRepository loanRepository;

    @Autowired
    private BookRepository bookRepository;

    @Autowired
    private UserRepository userRepository;

    @Test
    void seedsLoanlessUsersOnly() {
        User fresh = userRepository.save(new User("ada@example.com", "Ada", "hash"));
        User existing = userRepository.save(new User("bob@example.com", "Bob", "hash"));
        List<Book> books = bookRepository.findAll(Sort.by("isbn"));
        Instant borrowedAt = Instant.now().minus(Duration.ofDays(2));
        loanRepository.save(new Loan(existing, books.getLast(), borrowedAt,
                borrowedAt.plus(Duration.ofDays(LoanService.LOAN_DAYS))));
        int totalStock = totalStock(books);
        int firstStock = books.get(0).getStock();
        int secondStock = books.get(1).getStock();

        seeder.seed();

        HistoryResponse history = loanService.history(fresh);
        assertThat(history.loans()).extracting(LoanResponse::status).containsExactly(
                LoanStatus.BORROWED, LoanStatus.OVERDUE, LoanStatus.RETURNED, LoanStatus.UNPAID, LoanStatus.PAID);
        assertThat(history.loans()).extracting(LoanResponse::isbn)
                .containsExactlyInAnyOrderElementsOf(books.subList(0, 5).stream().map(Book::getIsbn).toList());
        assertThat(history.stats().totalOverdueFines()).isEqualByComparingTo("6.00");
        assertThat(loanService.history(existing).loans()).hasSize(1);
        assertThat(books.get(0).getStock()).isEqualTo(firstStock - 1);
        assertThat(books.get(1).getStock()).isEqualTo(secondStock - 1);
        assertThat(totalStock(books)).isEqualTo(totalStock - 2);

        seeder.seed();

        assertThat(loanService.history(fresh).loans()).hasSize(5);
        assertThat(totalStock(books)).isEqualTo(totalStock - 2);
    }

    private static int totalStock(List<Book> books) {
        return books.stream().mapToInt(Book::getStock).sum();
    }
}
