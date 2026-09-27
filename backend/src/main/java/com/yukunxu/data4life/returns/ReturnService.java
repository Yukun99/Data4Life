package com.yukunxu.data4life.returns;

import com.yukunxu.data4life.admin.AdminUserService;
import com.yukunxu.data4life.catalogue.BookRepository;
import com.yukunxu.data4life.interest.NamedItem;
import com.yukunxu.data4life.loan.Loan;
import com.yukunxu.data4life.loan.LoanRepository;
import com.yukunxu.data4life.loan.LoanService;
import com.yukunxu.data4life.loan.LoanStatus;
import com.yukunxu.data4life.user.User;
import com.yukunxu.data4life.user.UserService;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;
import java.util.function.Function;
import java.util.function.Predicate;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ReturnService {

    private static final BigDecimal ZERO = BigDecimal.ZERO.setScale(2);

    private static final Map<String, Comparator<ReturnLoanResponse>> SORTS = Map.of(
            "isbn", Comparator.comparing(ReturnLoanResponse::isbn),
            "title", Comparator.comparing(ReturnLoanResponse::title, String.CASE_INSENSITIVE_ORDER),
            "author", Comparator.comparing(ReturnLoanResponse::author, String.CASE_INSENSITIVE_ORDER),
            "genre", Comparator.comparing((ReturnLoanResponse row) -> row.genre().name(),
                    String.CASE_INSENSITIVE_ORDER),
            "language", Comparator.comparing((ReturnLoanResponse row) -> row.language().name(),
                    String.CASE_INSENSITIVE_ORDER),
            "due", Comparator.comparing(ReturnLoanResponse::until,
                    Comparator.nullsLast(Comparator.naturalOrder())));

    private static final Set<LoanStatus> LISTED = EnumSet.of(LoanStatus.BORROWED, LoanStatus.OVERDUE,
            LoanStatus.UNPAID, LoanStatus.RESERVED, LoanStatus.QUEUED);

    private final LoanRepository loanRepository;
    private final BookRepository bookRepository;
    private final LoanService loanService;
    private final UserService userService;

    public ReturnService(LoanRepository loanRepository, BookRepository bookRepository, LoanService loanService,
            UserService userService) {
        this.loanRepository = loanRepository;
        this.bookRepository = bookRepository;
        this.loanService = loanService;
        this.userService = userService;
    }

    @Transactional
    public ReturnLoansResponse list(User user, ReturnFilter filter, int page, int size, String sort, String dir) {
        if (!AdminUserService.PAGE_SIZES.contains(size)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid page size");
        }
        Comparator<ReturnLoanResponse> order = SORTS.get(sort);
        if (order == null || !(dir.equals("asc") || dir.equals("desc"))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid sort");
        }
        if (dir.equals("desc")) {
            order = order.reversed();
        }
        loanService.releaseExpired();
        Instant now = Instant.now();
        List<Loan> listed = loanRepository.findByUserNewestFirst(user).stream()
                .filter(loan -> LISTED.contains(LoanService.status(loan, now)))
                .toList();
        Map<String, List<Loan>> queues = loanService.queues(listed.stream()
                .filter(loan -> LoanService.status(loan, now) == LoanStatus.QUEUED)
                .map(loan -> loan.getBook().getIsbn())
                .toList());
        List<ReturnLoanResponse> all = listed.stream()
                .map(loan -> ReturnLoanResponse.from(loan, now, LoanService.status(loan, now) != LoanStatus.QUEUED
                        ? null
                        : LoanService.queuePosition(queues.get(loan.getBook().getIsbn()), user.getId())))
                .toList();
        List<ReturnLoanResponse> matching = all.stream()
                .filter(matches(filter))
                .sorted(order.thenComparing(ReturnLoanResponse::id))
                .toList();
        int totalPages = (matching.size() + size - 1) / size;
        int current = Math.max(page, 0);
        if (totalPages > 0 && current >= totalPages) {
            current = totalPages - 1;
        }
        int from = Math.min(current * size, matching.size());
        List<ReturnLoanResponse> slice = matching.subList(from, Math.min(from + size, matching.size()));
        BigDecimal totalUnpaid = all.stream()
                .filter(row -> row.status() == LoanStatus.UNPAID)
                .map(ReturnLoanResponse::fine)
                .reduce(ZERO, BigDecimal::add);
        return new ReturnLoansResponse(slice, current, totalPages, matching.size(), options(all), totalUnpaid);
    }

    /** Returns a loan; the copy goes back into stock or to the first eligible user in the queue. */
    @Transactional
    public ReturnLoanResponse returnLoan(User user, Long loanId) {
        String isbn = lockBook(user, loanId);
        Loan loan = loanRepository.findById(loanId).orElseThrow();
        if (loan.getBorrowedAt() == null) {
            throw conflict("This is a reservation");
        }
        if (loan.getReturnedAt() != null) {
            throw conflict("This book was already returned");
        }
        Instant now = Instant.now();
        loan.setReturnedAt(now);
        loanService.putBack(isbn, now);
        return ReturnLoanResponse.from(loan, now, null);
    }

    /** Cancels an active or queued reservation; the fee is not refunded and the row shows as expired afterwards. */
    @Transactional
    public ReturnLoanResponse unreserve(User user, Long loanId) {
        String isbn = lockBook(user, loanId);
        Loan loan = loanRepository.findById(loanId).orElseThrow();
        if (loan.getBorrowedAt() != null) {
            throw conflict("This is not a reservation");
        }
        Instant now = Instant.now();
        LoanStatus status = LoanService.status(loan, now);
        if (status != LoanStatus.RESERVED && status != LoanStatus.QUEUED) {
            throw conflict("This reservation has already ended");
        }
        loan.setReleasedAt(now);
        if (status == LoanStatus.RESERVED) {
            loanService.putBack(isbn, now);
        }
        return ReturnLoanResponse.from(loan, now, null);
    }

    /** Locks the book of the caller's loan before the loan is read, so queue changes on it run one at a time. */
    private String lockBook(User user, Long loanId) {
        String isbn = loanRepository.isbnOf(loanId, user)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Loan not found"));
        bookRepository.lockByIsbn(isbn);
        return isbn;
    }

    @Transactional(readOnly = true)
    public ReturnColumnWidths columns(String email) {
        String stored = userService.getByEmail(email).getReturnColumns();
        return stored == null ? null : ReturnColumnWidths.parse(stored);
    }

    @Transactional
    public ReturnColumnWidths saveColumns(String email, ReturnColumnWidths widths) {
        if (Math.abs(widths.total() - 100) > 0.5) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Column widths must total 100");
        }
        userService.getByEmail(email).setReturnColumns(widths.toStored());
        return widths;
    }

    private static Predicate<ReturnLoanResponse> matches(ReturnFilter filter) {
        List<Predicate<ReturnLoanResponse>> checks = new ArrayList<>();
        if (filter.isbn() != null) {
            checks.add(row -> row.isbn().equals(filter.isbn()));
        }
        if (filter.title() != null) {
            checks.add(row -> row.title().equals(filter.title()));
        }
        if (filter.author() != null) {
            checks.add(row -> row.author().equals(filter.author()));
        }
        if (filter.genreId() != null) {
            checks.add(row -> row.genre().id().equals(filter.genreId()));
        }
        if (filter.languageId() != null) {
            checks.add(row -> row.language().id().equals(filter.languageId()));
        }
        return row -> checks.stream().allMatch(check -> check.test(row));
    }

    private static ReturnFilterOptions options(Collection<ReturnLoanResponse> rows) {
        return new ReturnFilterOptions(distinct(rows, ReturnLoanResponse::isbn),
                distinct(rows, ReturnLoanResponse::title), distinct(rows, ReturnLoanResponse::author),
                named(rows, ReturnLoanResponse::genre), named(rows, ReturnLoanResponse::language));
    }

    private static List<String> distinct(Collection<ReturnLoanResponse> rows,
            Function<ReturnLoanResponse, String> key) {
        return List.copyOf(rows.stream().map(key).collect(Collectors.toCollection(TreeSet::new)));
    }

    /** Distinct by id, sorted by name. */
    private static List<NamedItem> named(Collection<ReturnLoanResponse> rows,
            Function<ReturnLoanResponse, NamedItem> key) {
        Map<Long, NamedItem> byId = new LinkedHashMap<>();
        rows.stream().map(key).forEach(item -> byId.putIfAbsent(item.id(), item));
        return byId.values().stream().sorted(Comparator.comparing(NamedItem::name)).toList();
    }

    private static ResponseStatusException conflict(String message) {
        return new ResponseStatusException(HttpStatus.CONFLICT, message);
    }
}
