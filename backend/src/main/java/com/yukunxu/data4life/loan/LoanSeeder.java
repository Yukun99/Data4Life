package com.yukunxu.data4life.loan;

import com.yukunxu.data4life.catalogue.Book;
import com.yukunxu.data4life.catalogue.BookRepository;
import com.yukunxu.data4life.user.User;
import com.yukunxu.data4life.user.UserRepository;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

// TODO remove this seeder once the borrow / return flow creates real loans.
@Component
public class LoanSeeder implements ApplicationRunner {

    private final UserRepository userRepository;
    private final BookRepository bookRepository;
    private final LoanRepository loanRepository;

    public LoanSeeder(UserRepository userRepository, BookRepository bookRepository, LoanRepository loanRepository) {
        this.userRepository = userRepository;
        this.bookRepository = bookRepository;
        this.loanRepository = loanRepository;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        seed();
    }

    @Transactional
    public void seed() {
        List<Book> books = bookRepository.findAll(Sort.by("isbn")).stream().limit(5).toList();
        if (books.size() < 5) {
            return;
        }
        Instant now = Instant.now().truncatedTo(ChronoUnit.SECONDS);
        for (User user : userRepository.findAll()) {
            if (loanRepository.existsByUser(user)) {
                continue;
            }
            borrow(user, books.get(0), now, 3, null, false);
            borrow(user, books.get(1), now, 20, null, false);
            borrow(user, books.get(2), now, 30, 25, false);
            borrow(user, books.get(3), now, 40, 20, false);
            borrow(user, books.get(4), now, 60, 40, true);
        }
    }

    private void borrow(User user, Book book, Instant now, int borrowedDaysAgo, Integer returnedDaysAgo,
            boolean paid) {
        Instant borrowedAt = now.minus(Duration.ofDays(borrowedDaysAgo));
        Loan loan = new Loan(user, book, borrowedAt, borrowedAt.plus(Duration.ofDays(LoanService.LOAN_DAYS)));
        if (returnedDaysAgo == null) {
            book.setStock(Math.max(0, book.getStock() - 1));
        } else {
            loan.setReturnedAt(now.minus(Duration.ofDays(returnedDaysAgo)));
        }
        if (paid) {
            loan.setFinePaidAt(loan.getReturnedAt());
        }
        loanRepository.save(loan);
    }
}
