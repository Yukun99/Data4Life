package com.yukunxu.data4life.loan;

import com.yukunxu.data4life.catalogue.Book;
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

    private static final long DAY_NANOS = Duration.ofDays(1).toNanos();

    private final LoanRepository repository;

    public LoanService(LoanRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public HistoryResponse history(User user) {
        Instant now = Instant.now();
        List<Loan> loans = repository.findByUserOrderByBorrowedAtDesc(user);
        List<LoanResponse> rows = loans.stream().map(loan -> toResponse(loan, now)).toList();
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
        repository.findByUserOrderByBorrowedAtDesc(user).stream()
                .filter(loan -> status(loan, now) == LoanStatus.UNPAID)
                .forEach(loan -> loan.setFinePaidAt(now));
    }

    @Transactional(readOnly = true)
    public List<LoanResponse> finedLoans(User user) {
        Instant now = Instant.now();
        return repository.findByUserOrderByBorrowedAtDesc(user).stream()
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

    public static LoanStatus status(Loan loan, Instant now) {
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
                status(loan, now), overdueDays(loan, now), fine(loan, now));
    }

    private static long overdueDays(Loan loan, Instant now) {
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
