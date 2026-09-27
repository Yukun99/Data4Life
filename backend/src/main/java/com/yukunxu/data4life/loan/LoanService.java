package com.yukunxu.data4life.loan;

import com.yukunxu.data4life.catalogue.Book;
import com.yukunxu.data4life.catalogue.BookRepository;
import com.yukunxu.data4life.notification.NotificationService;
import com.yukunxu.data4life.notification.NotificationType;
import com.yukunxu.data4life.user.User;
import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.Collection;
import java.util.Comparator;
import java.util.Iterator;
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
    private final NotificationService notificationService;

    public LoanService(LoanRepository repository, BookRepository bookRepository,
            NotificationService notificationService) {
        this.repository = repository;
        this.bookRepository = bookRepository;
        this.notificationService = notificationService;
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
            putBack(loan.getBook().getIsbn(), now);
        }
    }

    /** Returns one copy of the book to stock, then hands free copies to its queue. */
    @Transactional
    public void putBack(String isbn, Instant now) {
        Book book = bookRepository.lockByIsbn(isbn).orElseThrow();
        book.setStock(Math.min(book.getAmount(), book.getStock() + 1));
        serveQueue(book, now);
    }

    /** Gives free copies to queued users in order, removing blocked ones. Expects the book row locked. */
    public void serveQueue(Book book, Instant now) {
        Iterator<Loan> queue = repository.findQueued(List.of(book.getIsbn())).iterator();
        while (book.getStock() > 0 && queue.hasNext()) {
            Loan loan = queue.next();
            String block = fineBlock(loan.getUser(), now);
            if (block != null) {
                loan.setRemovedAt(now);
                loan.setReleasedAt(now);
                notificationService.send(loan, block.equals(UNPAID_BLOCK)
                        ? NotificationType.REMOVED_UNPAID : NotificationType.REMOVED_OVERDUE);
            } else {
                loan.setReservedUntil(now.plus(Duration.ofDays(RESERVE_DAYS)));
                book.setStock(book.getStock() - 1);
                notificationService.send(loan, NotificationType.AVAILABLE);
            }
        }
    }

    /** Queued rows per ISBN, each list in queue order. */
    public Map<String, List<Loan>> queues(Collection<String> isbns) {
        if (isbns.isEmpty()) {
            return Map.of();
        }
        return repository.findQueued(isbns).stream()
                .collect(Collectors.groupingBy(loan -> loan.getBook().getIsbn()));
    }

    /** One-based place of the user in the queue, or null when they are not in it. */
    public static Integer queuePosition(List<Loan> queue, Long userId) {
        for (int i = 0; i < queue.size(); i++) {
            if (queue.get(i).getUser().getId().equals(userId)) {
                return i + 1;
            }
        }
        return null;
    }

    /** Why the user may not borrow or reserve right now, or null when they may. Expects released reservations. */
    public String borrowBlock(User user, Instant now) {
        List<Loan> loans = repository.findByUserNewestFirst(user);
        String block = fineBlock(loans, now);
        if (block != null) {
            return block;
        }
        if (loans.stream().filter(LoanService::isHolding).count() >= MAX_HOLDINGS) {
            return FULL_BLOCK;
        }
        return null;
    }

    /** Unpaid fines or an overdue book, or null when neither applies. */
    public String fineBlock(User user, Instant now) {
        return fineBlock(repository.findByUserNewestFirst(user), now);
    }

    private static String fineBlock(List<Loan> loans, Instant now) {
        if (loans.stream().anyMatch(loan -> status(loan, now) == LoanStatus.UNPAID)) {
            return UNPAID_BLOCK;
        }
        if (loans.stream().anyMatch(loan -> status(loan, now) == LoanStatus.OVERDUE)) {
            return OVERDUE_BLOCK;
        }
        return null;
    }

    /** An open loan or an unreleased reservation; only exact once {@link #releaseExpired()} has run. */
    public static boolean isHolding(Loan loan) {
        return loan.getReturnedAt() == null && loan.getReleasedAt() == null;
    }

    public static LoanStatus status(Loan loan, Instant now) {
        if (loan.getBorrowedAt() == null) {
            if (loan.getRemovedAt() != null) {
                return LoanStatus.REMOVED;
            }
            if (loan.getReleasedAt() != null) {
                return LoanStatus.EXPIRED;
            }
            if (loan.getReservedUntil() == null) {
                return LoanStatus.QUEUED;
            }
            return now.isAfter(loan.getReservedUntil()) ? LoanStatus.EXPIRED : LoanStatus.RESERVED;
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
