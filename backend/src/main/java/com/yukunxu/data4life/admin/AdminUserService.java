package com.yukunxu.data4life.admin;

import com.yukunxu.data4life.loan.Loan;
import com.yukunxu.data4life.loan.LoanRepository;
import com.yukunxu.data4life.loan.LoanResponse;
import com.yukunxu.data4life.loan.LoanService;
import com.yukunxu.data4life.loan.LoanStatus;
import com.yukunxu.data4life.user.User;
import com.yukunxu.data4life.user.UserRepository;
import com.yukunxu.data4life.user.UserService;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;
import java.util.function.Function;
import java.util.function.Predicate;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.session.SessionInformation;
import org.springframework.security.core.session.SessionRegistry;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AdminUserService {

    public static final Set<Integer> PAGE_SIZES = Set.of(10, 20, 50);

    private static final BigDecimal ZERO = BigDecimal.ZERO.setScale(2);

    private static final Map<String, Comparator<AdminUserResponse>> SORTS = Map.of(
            "name", Comparator.comparing(AdminUserResponse::name, String.CASE_INSENSITIVE_ORDER),
            "email", Comparator.comparing(AdminUserResponse::email, String.CASE_INSENSITIVE_ORDER),
            "admin", Comparator.comparing(AdminUserResponse::admin),
            "joined", Comparator.comparing(AdminUserResponse::createdAt),
            "totalBorrows", Comparator.comparingInt(AdminUserResponse::totalBorrows),
            "currentBorrows", Comparator.comparingInt(AdminUserResponse::currentBorrows),
            "totalFines", Comparator.comparing(AdminUserResponse::totalFines),
            "currentFines", Comparator.comparing(AdminUserResponse::currentFines));

    private final UserService userService;
    private final UserRepository userRepository;
    private final LoanRepository loanRepository;
    private final LoanService loanService;
    private final SessionRegistry sessionRegistry;

    public AdminUserService(UserService userService, UserRepository userRepository, LoanRepository loanRepository,
            LoanService loanService, SessionRegistry sessionRegistry) {
        this.userService = userService;
        this.userRepository = userRepository;
        this.loanRepository = loanRepository;
        this.loanService = loanService;
        this.sessionRegistry = sessionRegistry;
    }

    @Transactional(readOnly = true)
    public AdminUsersResponse list(String callerEmail, UserFilter filter, int page, int size, String sort,
            String dir) {
        if (!PAGE_SIZES.contains(size)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid page size");
        }
        Comparator<AdminUserResponse> order = SORTS.get(sort);
        if (order == null || !(dir.equals("asc") || dir.equals("desc"))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid sort");
        }
        if (dir.equals("desc")) {
            order = order.reversed();
        }
        User caller = userService.getByEmail(callerEmail);
        Instant now = Instant.now();
        Map<Long, List<Loan>> loans = loanRepository.findAllWithUser().stream()
                .collect(Collectors.groupingBy(loan -> loan.getUser().getId()));
        List<AdminUserResponse> all = userRepository.findAll().stream()
                .map(user -> row(user, loans.getOrDefault(user.getId(), List.of()), now, caller))
                .toList();
        List<AdminUserResponse> matching = all.stream()
                .filter(matches(filter))
                .sorted(order.thenComparing(AdminUserResponse::id))
                .toList();
        int totalPages = (matching.size() + size - 1) / size;
        int current = Math.max(page, 0);
        if (totalPages > 0 && current >= totalPages) {
            current = totalPages - 1;
        }
        int from = Math.min(current * size, matching.size());
        List<AdminUserResponse> slice = matching.subList(from, Math.min(from + size, matching.size()));
        return new AdminUsersResponse(slice, current, totalPages, matching.size(), options(all));
    }

    @Transactional
    public AdminUserResponse promote(String callerEmail, Long id) {
        User caller = userService.getByEmail(callerEmail);
        User target = find(id);
        if (target.isAdmin()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "User is already an admin");
        }
        target.setAdmin(true);
        target.setPromotedById(caller.getId());
        expireSessions(target);
        return row(target, caller);
    }

    @Transactional
    public AdminUserResponse demote(String callerEmail, Long id) {
        User caller = userService.getByEmail(callerEmail);
        User target = find(id);
        if (!target.isAdmin()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "User is not an admin");
        }
        if (userService.isRoot(target)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "The root admin cannot be demoted");
        }
        if (target.getId().equals(caller.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You cannot demote yourself");
        }
        if (!isPromoter(caller, target)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Only the admin who promoted this user can demote them");
        }
        target.setAdmin(false);
        target.setPromotedById(null);
        expireSessions(target);
        return row(target, caller);
    }

    @Transactional
    public void delete(String callerEmail, Long id) {
        User caller = userService.getByEmail(callerEmail);
        User target = find(id);
        if (userService.isRoot(target)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "The root admin cannot be deleted");
        }
        if (target.getId().equals(caller.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You cannot delete yourself");
        }
        if (target.isAdmin() && !isPromoter(caller, target)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Only the admin who promoted this user can delete them");
        }
        remove(target);
    }

    @Transactional
    public void deleteSelf(String email) {
        User user = userService.getByEmail(email);
        if (userService.isRoot(user)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "The root admin cannot be deleted");
        }
        remove(user);
    }

    @Transactional(readOnly = true)
    public List<LoanResponse> fines(Long id) {
        return loanService.finedLoans(find(id));
    }

    @Transactional
    public List<LoanResponse> forgive(Long id, Long loanId) {
        User target = find(id);
        loanService.forgive(target, loanId);
        return loanService.finedLoans(target);
    }

    @Transactional(readOnly = true)
    public UserColumnWidths columns(String email) {
        String stored = userService.getByEmail(email).getUsersColumns();
        return stored == null ? null : UserColumnWidths.parse(stored);
    }

    @Transactional
    public UserColumnWidths saveColumns(String email, UserColumnWidths widths) {
        if (Math.abs(widths.total() - 100) > 0.5) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Column widths must total 100");
        }
        userService.getByEmail(email).setUsersColumns(widths.toStored());
        return widths;
    }

    private AdminUserResponse row(User user, User caller) {
        return row(user, loanRepository.findByUserOrderByBorrowedAtDesc(user), Instant.now(), caller);
    }

    private AdminUserResponse row(User user, List<Loan> loans, Instant now, User caller) {
        int current = (int) loans.stream().filter(loan -> loan.getReturnedAt() == null).count();
        BigDecimal totalFines = ZERO;
        BigDecimal currentFines = ZERO;
        for (Loan loan : loans) {
            BigDecimal fine = LoanService.fine(loan, now);
            totalFines = totalFines.add(fine);
            LoanStatus status = LoanService.status(loan, now);
            if (status == LoanStatus.UNPAID || status == LoanStatus.OVERDUE) {
                currentFines = currentFines.add(fine);
            }
        }
        boolean other = !user.getId().equals(caller.getId()) && !userService.isRoot(user);
        boolean demotable = other && user.isAdmin() && isPromoter(caller, user);
        boolean deletable = other && (!user.isAdmin() || isPromoter(caller, user));
        return new AdminUserResponse(user.getId(), user.getName(), user.getEmail(), user.getCreatedAt(),
                user.isAdmin(), loans.size(), current, totalFines, currentFines, demotable, deletable);
    }

    /** Root may demote anyone; otherwise only the recorded promoter, with no record meaning root. */
    private boolean isPromoter(User caller, User target) {
        return userService.isRoot(caller) || caller.getId().equals(target.getPromotedById());
    }

    /** Refuses while books are out or fines unpaid; otherwise removes the user with their loans and interests. */
    private void remove(User user) {
        List<Loan> loans = loanRepository.findByUserOrderByBorrowedAtDesc(user);
        Instant now = Instant.now();
        if (loans.stream().anyMatch(loan -> loan.getReturnedAt() == null)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "User still has books on loan");
        }
        if (loans.stream().anyMatch(loan -> LoanService.status(loan, now) == LoanStatus.UNPAID)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "User still has unpaid fines");
        }
        userRepository.findByPromotedById(user.getId()).forEach(promoted -> promoted.setPromotedById(null));
        loanRepository.deleteAll(loans);
        userRepository.delete(user);
        expireSessions(user);
    }

    private void expireSessions(User user) {
        sessionRegistry.getAllSessions(user.getEmail(), false).forEach(SessionInformation::expireNow);
    }

    private User find(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private static Predicate<AdminUserResponse> matches(UserFilter filter) {
        List<Predicate<AdminUserResponse>> checks = new ArrayList<>();
        if (filter.name() != null) {
            checks.add(row -> row.name().equals(filter.name()));
        }
        if (filter.email() != null) {
            checks.add(row -> row.email().equals(filter.email()));
        }
        if (filter.admin() != null) {
            checks.add(row -> row.admin() == filter.admin());
        }
        if (filter.totalBorrows() != null) {
            checks.add(row -> row.totalBorrows() == filter.totalBorrows());
        }
        if (filter.currentBorrows() != null) {
            checks.add(row -> row.currentBorrows() == filter.currentBorrows());
        }
        if (filter.totalFines() != null) {
            checks.add(row -> row.totalFines().compareTo(filter.totalFines()) == 0);
        }
        if (filter.currentFines() != null) {
            checks.add(row -> row.currentFines().compareTo(filter.currentFines()) == 0);
        }
        return row -> checks.stream().allMatch(check -> check.test(row));
    }

    private static UserFilterOptions options(Collection<AdminUserResponse> rows) {
        return new UserFilterOptions(distinct(rows, AdminUserResponse::name),
                distinct(rows, AdminUserResponse::email), distinct(rows, AdminUserResponse::admin),
                distinct(rows, AdminUserResponse::totalBorrows), distinct(rows, AdminUserResponse::currentBorrows),
                distinct(rows, AdminUserResponse::totalFines), distinct(rows, AdminUserResponse::currentFines));
    }

    private static <T extends Comparable<? super T>> List<T> distinct(Collection<AdminUserResponse> rows,
            Function<AdminUserResponse, T> key) {
        return List.copyOf(rows.stream().map(key).collect(Collectors.toCollection(TreeSet::new)));
    }
}
