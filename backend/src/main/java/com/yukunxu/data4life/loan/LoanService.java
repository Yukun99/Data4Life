package com.yukunxu.data4life.loan;

import com.yukunxu.data4life.catalogue.Book;
import com.yukunxu.data4life.catalogue.BookRepository;
import com.yukunxu.data4life.user.User;
import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class LoanService {

    public static final int LOAN_DAYS = 14;
    public static final BigDecimal FINE_PER_DAY = new BigDecimal("1.00");
    public static final int RESERVE_DAYS = 7;
    public static final BigDecimal RESERVE_FEE = new BigDecimal("5.00");
    public static final int MAX_HOLDINGS = 8;
    public static final String UNPAID_BLOCK = "You have unpaid fines";
    public static final String OVERDUE_BLOCK = "You have an overdue book";
    public static final String FULL_BLOCK = "You already hold " + MAX_HOLDINGS + " books";

    private static final BigDecimal ZERO = BigDecimal.ZERO.setScale(2);
    private static final long DAY_NANOS = Duration.ofDays(1).toNanos();

    private final LoanRepository repository;
    private final BookRepository bookRepository;

    public LoanService(LoanRepository repository, BookRepository bookRepository) {
        this.repository = repository;
        this.bookRepository = bookRepository;
    }

    @Transactional
    public HistoryResponse history(User user) {
        releaseExpired();
        Instant now = Instant.now();
        List<Loan> all = repository.findByUserNewestFirst(user);
        List<LoanResponse> rows = all.stream().map(loan -> toResponse(loan, now)).toList();
        List<Loan> loans = all.stream().filter(loan -> loan.getBorrowedAt() != null).toList();
        BigDecimal total = rows.stream()
                .filter(row -> row.status() == LoanStatus.UNPAID)
                .map(LoanResponse::fine)
                .reduce(BigDecimal.ZERO.setScale(2), BigDecimal::add);
        HistoryStats stats = new HistoryStats(loans.size(),
                mode(loans, loan -> loan.getBook().getGenre().getName()),
                mode(loans, loan -> loan.getBook().getAuthor()),
                total);
        return new HistoryResponse(stats, rows);
    }

    @Transactional
    public void pay(User user, Long loanId) {
        Loan loan = find(user, loanId);
        Instant now = Instant.now();
        if (status(loan, now) != LoanStatus.UNPAID) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This loan has no unpaid fine");
        }
        loan.setFinePaidAt(now);
    }

    @Transactional
    public void payAll(User user) {
        Instant now = Instant.now();
        repository.findByUserNewestFirst(user).stream()
                .filter(loan -> status(loan, now) == LoanStatus.UNPAID)
                .forEach(loan -> loan.setFinePaidAt(now));
    }

    @Transactional(readOnly = true)
    public List<LoanResponse> finedLoans(User user) {
        Instant now = Instant.now();
        return repository.findByUserNewestFirst(user).stream()
                .filter(loan -> fine(loan, now).signum() > 0)
                .map(loan -> toResponse(loan, now))
                .toList();
    }

    @Transactional
    public void forgive(User user, Long loanId) {
        Loan loan = find(user, loanId);
        Instant now = Instant.now();
        if (status(loan, now) != LoanStatus.UNPAID) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This loan has no unpaid fine");
        }
        loan.setFineForgivenAt(now);
    }

    /** Puts the copies of expired, unreleased reservations back into stock, exactly once each. */
    @Transactional
    public void releaseExpired() {
        Instant now = Instant.now();
        for (Loan loan : repository.lockExpiredReservations(now)) {
            loan.setReleasedAt(now);
            Book book = bookRepository.lockByIsbn(loan.getBook().getIsbn()).orElseThrow();
            book.setStock(Math.min(book.getAmount(), book.getStock() + 1));
        }
    }

    /** Why the user may not borrow or reserve right now, or null when they may. Expects released reservations. */
    public String borrowBlock(User user, Instant now) {
        List<Loan> loans = repository.findByUserNewestFirst(user);
        if (loans.stream().anyMatch(loan -> status(loan, now) == LoanStatus.UNPAID)) {
            return UNPAID_BLOCK;
        }
        if (loans.stream().anyMatch(loan -> status(loan, now) == LoanStatus.OVERDUE)) {
            return OVERDUE_BLOCK;
        }
        if (loans.stream().filter(LoanService::isHolding).count() >= MAX_HOLDINGS) {
            return FULL_BLOCK;
        }
        return null;
    }

    /** An open loan or an unreleased reservation; only exact once {@link #releaseExpired()} has run. */
    public static boolean isHolding(Loan loan) {
        return loan.getReturnedAt() == null && loan.getReleasedAt() == null;
    }

    public static LoanStatus status(Loan loan, Instant now) {
        if (loan.getBorrowedAt() == null) {
            boolean expired = loan.getReleasedAt() != null || now.isAfter(loan.getReservedUntil());
            return expired ? LoanStatus.EXPIRED : LoanStatus.RESERVED;
        }
        if (loan.getReturnedAt() == null) {
            return now.isAfter(loan.getDueAt()) ? LoanStatus.OVERDUE : LoanStatus.BORROWED;
        }
        if (!loan.getReturnedAt().isAfter(loan.getDueAt())) {
            return LoanStatus.RETURNED;
        }
        if (loan.getFinePaidAt() != null) {
            return LoanStatus.PAID;
        }
        return loan.getFineForgivenAt() != null ? LoanStatus.FORGIVEN : LoanStatus.UNPAID;
    }

    /** Whole days past the due date, counting a started day as a full one. */
    public static long overdueDays(Instant dueAt, Instant end) {
        if (!end.isAfter(dueAt)) {
            return 0;
        }
        return Math.ceilDiv(Duration.between(dueAt, end).toNanos(), DAY_NANOS);
    }

    public static BigDecimal fine(Loan loan, Instant now) {
        return FINE_PER_DAY.multiply(BigDecimal.valueOf(overdueDays(loan, now)));
    }

    public static LoanResponse toResponse(Loan loan, Instant now) {
        Book book = loan.getBook();
        return new LoanResponse(loan.getId(), book.getIsbn(), book.getTitle(), book.getAuthor(),
                book.getGenre().getName(), loan.getBorrowedAt(), loan.getDueAt(), loan.getReturnedAt(),
                status(loan, now), overdueDays(loan, now), fine(loan, now), loan.getReservedAt(),
                loan.getReservedUntil(), loan.getReservedAt() != null ? RESERVE_FEE : ZERO);
    }

    private static long overdueDays(Loan loan, Instant now) {
        if (loan.getBorrowedAt() == null) {
            return 0;
        }
        return overdueDays(loan.getDueAt(), loan.getReturnedAt() == null ? now : loan.getReturnedAt());
    }

    private Loan find(User user, Long loanId) {
        return repository.findById(loanId)
                .filter(found -> found.getUser().getId().equals(user.getId()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Loan not found"));
    }

    /** Most frequent value, ties going to the alphabetically first; null when there are no loans. */
    private static String mode(List<Loan> loans, Function<Loan, String> key) {
        Map<String, Long> counts = loans.stream().collect(Collectors.groupingBy(key, Collectors.counting()));
        return counts.entrySet().stream()
                .min(Comparator.comparing((Map.Entry<String, Long> entry) -> -entry.getValue())
                        .thenComparing(Map.Entry::getKey))
                .map(Map.Entry::getKey)
                .orElse(null);
    }
}
