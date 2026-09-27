package com.yukunxu.data4life.loan;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.yukunxu.data4life.catalogue.Book;
import com.yukunxu.data4life.catalogue.BookRepository;
import com.yukunxu.data4life.user.User;
import com.yukunxu.data4life.user.UserRepository;
import java.time.Duration;
import java.time.Instant;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class LoanServiceTest {

    private static final String SAPIENS = "9780062316097";
    private static final String CHRISTIE = "9780062693662";
    private static final String KOKORO = "9784101010137";
    private static final String RED_CHAMBER = "9787020002207";
    private static final String DUNE = "9780441172719";

    @Autowired
    private LoanService loanService;

    @Autowired
    private LoanRepository loanRepository;

    @Autowired
    private BookRepository bookRepository;

    @Autowired
    private UserRepository userRepository;

    private User user;
    private Instant now;

    @BeforeEach
    void setUp() {
        user = userRepository.save(new User("ada@example.com", "Ada", "hash"));
        now = Instant.now();
    }

    @Test
    void borrowedWithinLoanPeriod() {
        Loan loan = loan(SAPIENS, now.minus(days(3)), null, null);

        LoanResponse row = onlyRow();
        assertThat(row.id()).isEqualTo(loan.getId());
        assertThat(row.status()).isEqualTo(LoanStatus.BORROWED);
        assertThat(row.overdueDays()).isZero();
        assertThat(row.fine()).isEqualByComparingTo("0.00");
        assertThat(row.dueAt()).isEqualTo(loan.getDueAt());
    }

    @Test
    void overdueCountsDaysSoFar() {
        loan(SAPIENS, now.minus(days(20)).plus(Duration.ofHours(1)), null, null);

        LoanResponse row = onlyRow();
        assertThat(row.status()).isEqualTo(LoanStatus.OVERDUE);
        assertThat(row.overdueDays()).isEqualTo(6);
        assertThat(row.fine()).isEqualByComparingTo("6.00");
    }

    @Test
    void returnedOnTimeHasNoFine() {
        loan(SAPIENS, now.minus(days(30)), now.minus(days(25)), null);

        LoanResponse row = onlyRow();
        assertThat(row.status()).isEqualTo(LoanStatus.RETURNED);
        assertThat(row.overdueDays()).isZero();
        assertThat(row.fine()).isEqualByComparingTo("0.00");
    }

    @Test
    void returnedExactlyOnDueDateIsReturned() {
        Instant borrowedAt = now.minus(days(30));
        loan(SAPIENS, borrowedAt, borrowedAt.plus(days(LoanService.LOAN_DAYS)), null);

        assertThat(onlyRow().status()).isEqualTo(LoanStatus.RETURNED);
    }

    @Test
    void returnedLateIsUnpaid() {
        loan(SAPIENS, now.minus(days(40)), now.minus(days(20)), null);

        LoanResponse row = onlyRow();
        assertThat(row.status()).isEqualTo(LoanStatus.UNPAID);
        assertThat(row.overdueDays()).isEqualTo(6);
        assertThat(row.fine()).isEqualByComparingTo("6.00");
        assertThat(row.fine().scale()).isEqualTo(2);
    }

    @Test
    void partialDayLateCountsAsOneDay() {
        Instant borrowedAt = now.minus(days(30));
        loan(SAPIENS, borrowedAt, borrowedAt.plus(days(LoanService.LOAN_DAYS)).plus(Duration.ofHours(1)), null);

        LoanResponse row = onlyRow();
        assertThat(row.status()).isEqualTo(LoanStatus.UNPAID);
        assertThat(row.overdueDays()).isEqualTo(1);
        assertThat(row.fine()).isEqualByComparingTo("1.00");
    }

    @Test
    void paidKeepsFine() {
        loan(SAPIENS, now.minus(days(60)), now.minus(days(40)), now.minus(days(39)));

        LoanResponse row = onlyRow();
        assertThat(row.status()).isEqualTo(LoanStatus.PAID);
        assertThat(row.overdueDays()).isEqualTo(6);
        assertThat(row.fine()).isEqualByComparingTo("6.00");
    }

    @Test
    void forgivenKeepsFineButIsNotUnpaid() {
        loan(SAPIENS, now.minus(days(60)), now.minus(days(40)), null, now.minus(days(39)));

        LoanResponse row = onlyRow();
        assertThat(row.status()).isEqualTo(LoanStatus.FORGIVEN);
        assertThat(row.fine()).isEqualByComparingTo("6.00");
        assertThat(loanService.history(user).stats().totalOverdueFines()).isEqualByComparingTo("0.00");
    }

    @Test
    void fineUsesReturnDateOrNow() {
        Loan open = loan(SAPIENS, now.minus(days(20)).plus(Duration.ofHours(1)), null, null);
        Loan returned = loan(CHRISTIE, now.minus(days(40)), now.minus(days(20)), null);
        Loan onTime = loan(KOKORO, now.minus(days(3)), null, null);

        assertThat(LoanService.fine(open, now)).isEqualByComparingTo("6.00");
        assertThat(LoanService.fine(returned, now.plus(days(10)))).isEqualByComparingTo("6.00");
        assertThat(LoanService.fine(onTime, now)).isEqualByComparingTo("0.00");
        assertThat(LoanService.fine(onTime, now).scale()).isEqualTo(2);
    }

    @Test
    void forgiveMarksUnpaidLoanForgiven() {
        Loan loan = loan(SAPIENS, now.minus(days(40)), now.minus(days(20)), null);

        loanService.forgive(user, loan.getId());

        assertThat(loan.getFineForgivenAt()).isNotNull();
        assertThat(onlyRow().status()).isEqualTo(LoanStatus.FORGIVEN);
        assertStatus(() -> loanService.forgive(user, loan.getId()), HttpStatus.CONFLICT);
        assertStatus(() -> loanService.pay(user, loan.getId()), HttpStatus.CONFLICT);
    }

    @Test
    void finedLoansListsOnlyLoansWithAFine() {
        loan(SAPIENS, now.minus(days(3)), null, null);
        loan(CHRISTIE, now.minus(days(30)), now.minus(days(25)), null);
        Loan overdue = loan(KOKORO, now.minus(days(20)), null, null);
        Loan unpaid = loan(RED_CHAMBER, now.minus(days(40)), now.minus(days(20)), null);
        Loan paid = loan(SAPIENS, now.minus(days(60)), now.minus(days(40)), now.minus(days(39)));
        Loan forgiven = loan(SAPIENS, now.minus(days(70)), now.minus(days(50)), null, now.minus(days(49)));

        assertThat(loanService.finedLoans(user)).extracting(LoanResponse::id)
                .containsExactly(overdue.getId(), unpaid.getId(), paid.getId(), forgiven.getId());
    }

    @Test
    void statsWithoutLoans() {
        HistoryResponse history = loanService.history(user);

        assertThat(history.loans()).isEmpty();
        assertThat(history.stats().booksBorrowed()).isZero();
        assertThat(history.stats().favouriteGenre()).isNull();
        assertThat(history.stats().favouriteAuthor()).isNull();
        assertThat(history.stats().totalOverdueFines()).isEqualByComparingTo("0.00");
    }

    @Test
    void statsCountFavouritesAndUnpaidFines() {
        loan(KOKORO, now.minus(days(40)), now.minus(days(20)), null);
        loan(KOKORO, now.minus(days(30)), now.minus(days(25)), null);
        loan(RED_CHAMBER, now.minus(days(30)).plus(Duration.ofHours(1)), now.minus(days(15)), null);
        loan(SAPIENS, now.minus(days(20)).plus(Duration.ofHours(1)), null, null);
        loan(CHRISTIE, now.minus(days(60)), now.minus(days(40)), now.minus(days(39)));

        HistoryResponse history = loanService.history(user);

        assertThat(history.stats().booksBorrowed()).isEqualTo(5);
        assertThat(history.stats().favouriteGenre()).isEqualTo("Literary Fiction");
        assertThat(history.stats().favouriteAuthor()).isEqualTo("Natsume Soseki");
        assertThat(history.stats().totalOverdueFines()).isEqualByComparingTo("7.00");
        assertThat(history.loans()).extracting(LoanResponse::borrowedAt).isSortedAccordingTo((a, b) -> b.compareTo(a));
    }

    @Test
    void favouritesTieGoesToAlphabeticalFirst() {
        loan(SAPIENS, now.minus(days(3)), null, null);
        loan(CHRISTIE, now.minus(days(2)), null, null);

        HistoryStats stats = loanService.history(user).stats();

        assertThat(stats.favouriteGenre()).isEqualTo("History");
        assertThat(stats.favouriteAuthor()).isEqualTo("Agatha Christie");
    }

    @Test
    void payMarksUnpaidLoanPaid() {
        Loan loan = loan(SAPIENS, now.minus(days(40)), now.minus(days(20)), null);

        loanService.pay(user, loan.getId());

        assertThat(loan.getFinePaidAt()).isNotNull();
        assertThat(onlyRow().status()).isEqualTo(LoanStatus.PAID);
        assertThat(loanService.history(user).stats().totalOverdueFines()).isEqualByComparingTo("0.00");
    }

    @Test
    void payWithoutUnpaidFineIsConflict() {
        Loan borrowed = loan(SAPIENS, now.minus(days(3)), null, null);
        Loan overdue = loan(SAPIENS, now.minus(days(20)), null, null);
        Loan returned = loan(SAPIENS, now.minus(days(30)), now.minus(days(25)), null);
        Loan paid = loan(SAPIENS, now.minus(days(60)), now.minus(days(40)), now.minus(days(39)));
        Loan forgiven = loan(SAPIENS, now.minus(days(60)), now.minus(days(40)), null, now.minus(days(39)));

        for (Loan loan : new Loan[] {borrowed, overdue, returned, paid, forgiven}) {
            assertStatus(() -> loanService.pay(user, loan.getId()), HttpStatus.CONFLICT);
        }
    }

    @Test
    void payOtherUsersLoanIsNotFound() {
        User other = userRepository.save(new User("bob@example.com", "Bob", "hash"));
        Loan loan = loan(SAPIENS, now.minus(days(40)), now.minus(days(20)), null);

        assertStatus(() -> loanService.pay(other, loan.getId()), HttpStatus.NOT_FOUND);
        assertStatus(() -> loanService.pay(user, -1L), HttpStatus.NOT_FOUND);
        assertThat(loan.getFinePaidAt()).isNull();
    }

    @Test
    void payAllPaysOnlyUnpaidLoans() {
        Loan unpaid = loan(SAPIENS, now.minus(days(40)), now.minus(days(20)), null);
        Loan secondUnpaid = loan(CHRISTIE, now.minus(days(35)), now.minus(days(20)), null);
        Loan overdue = loan(KOKORO, now.minus(days(20)), null, null);
        Loan returned = loan(RED_CHAMBER, now.minus(days(30)), now.minus(days(25)), null);

        loanService.payAll(user);

        assertThat(unpaid.getFinePaidAt()).isNotNull();
        assertThat(secondUnpaid.getFinePaidAt()).isNotNull();
        assertThat(overdue.getFinePaidAt()).isNull();
        assertThat(returned.getFinePaidAt()).isNull();
        assertThat(loanService.history(user).stats().totalOverdueFines()).isEqualByComparingTo("0.00");
    }

    @Test
    void reservationIsReservedWithFeeAndNoFine() {
        reserve(SAPIENS, now.plus(days(6)));

        LoanResponse row = onlyRow();
        assertThat(row.status()).isEqualTo(LoanStatus.RESERVED);
        assertThat(row.borrowedAt()).isNull();
        assertThat(row.dueAt()).isNull();
        assertThat(row.overdueDays()).isZero();
        assertThat(row.fine()).isEqualByComparingTo("0.00");
        assertThat(row.fee()).isEqualByComparingTo("5.00");
        HistoryStats stats = loanService.history(user).stats();
        assertThat(stats.booksBorrowed()).isZero();
        assertThat(stats.favouriteGenre()).isNull();
    }

    @Test
    void reservationExpiresPastItsEndOrOnceReleased() {
        Loan past = reserve(SAPIENS, now.minus(Duration.ofHours(1)));
        Loan released = reserve(CHRISTIE, now.plus(days(3)));
        released.setReleasedAt(now);

        assertThat(LoanService.status(past, now)).isEqualTo(LoanStatus.EXPIRED);
        assertThat(LoanService.status(released, now)).isEqualTo(LoanStatus.EXPIRED);
        assertThat(LoanService.fine(past, now)).isEqualByComparingTo("0.00");
    }

    @Test
    void releaseExpiredRestoresStockOnce() {
        Book dune = bookRepository.findById(DUNE).orElseThrow();
        dune.setStock(1);
        Loan expired = reserve(DUNE, now.minus(Duration.ofHours(1)));
        Loan active = reserve(DUNE, now.plus(days(3)));

        loanService.releaseExpired();
        loanService.releaseExpired();

        assertThat(expired.getReleasedAt()).isNotNull();
        assertThat(active.getReleasedAt()).isNull();
        assertThat(dune.getStock()).isEqualTo(2);
        assertThat(LoanService.isHolding(expired)).isFalse();
        assertThat(LoanService.isHolding(active)).isTrue();
    }

    @Test
    void releaseNeverRaisesStockAboveAmount() {
        Book dune = bookRepository.findById(DUNE).orElseThrow();
        reserve(DUNE, now.minus(Duration.ofHours(1)));

        loanService.releaseExpired();

        assertThat(dune.getStock()).isEqualTo(dune.getAmount());
    }

    @Test
    void borrowBlockReasonsInOrder() {
        assertThat(loanService.borrowBlock(user, now)).isNull();

        loan(SAPIENS, now.minus(days(20)), null, null);
        assertThat(loanService.borrowBlock(user, now)).isEqualTo("You have an overdue book");

        loan(CHRISTIE, now.minus(days(40)), now.minus(days(20)), null);
        assertThat(loanService.borrowBlock(user, now)).isEqualTo("You have unpaid fines");
    }

    @Test
    void borrowBlockAtEightHoldings() {
        for (int i = 0; i < 7; i++) {
            reserve(SAPIENS, now.plus(days(3)));
        }
        Loan expired = reserve(SAPIENS, now.minus(Duration.ofHours(1)));
        loan(KOKORO, now.minus(days(30)), now.minus(days(25)), null);
        loanService.releaseExpired();
        assertThat(expired.getReleasedAt()).isNotNull();
        assertThat(loanService.borrowBlock(user, now)).isNull();

        loan(CHRISTIE, now.minus(days(2)), null, null);
        assertThat(loanService.borrowBlock(user, now)).isEqualTo("You already hold 8 books");
    }

    @Test
    void queuedLeftAndRemovedStatuses() {
        Loan queued = loanRepository.save(Loan.queued(user, bookRepository.findById(SAPIENS).orElseThrow(), now));
        Loan left = loanRepository.save(Loan.queued(user, bookRepository.findById(CHRISTIE).orElseThrow(), now));
        left.setReleasedAt(now);
        Loan removed = loanRepository.save(Loan.queued(user, bookRepository.findById(KOKORO).orElseThrow(), now));
        removed.setReleasedAt(now);
        removed.setRemovedAt(now);

        assertThat(LoanService.status(queued, now)).isEqualTo(LoanStatus.QUEUED);
        assertThat(LoanService.status(left, now)).isEqualTo(LoanStatus.EXPIRED);
        assertThat(LoanService.status(removed, now)).isEqualTo(LoanStatus.REMOVED);
        assertThat(LoanService.isHolding(queued)).isTrue();
        assertThat(LoanService.isHolding(removed)).isFalse();
        assertThat(LoanService.toResponse(queued, now).fee()).isEqualByComparingTo("5.00");
        assertThat(LoanService.toResponse(queued, now).reservedUntil()).isNull();
    }

    @Test
    void releaseExpiredServesTheQueue() {
        Book dune = bookRepository.findById(DUNE).orElseThrow();
        dune.setStock(0);
        Loan expired = reserve(DUNE, now.minus(Duration.ofHours(1)));
        User bob = userRepository.save(new User("bob@example.com", "Bob", "hash"));
        Loan queued = loanRepository.save(Loan.queued(bob, dune, now));

        loanService.releaseExpired();

        assertThat(expired.getReleasedAt()).isNotNull();
        assertThat(queued.getReservedUntil()).isNotNull();
        assertThat(LoanService.status(queued, Instant.now())).isEqualTo(LoanStatus.RESERVED);
        assertThat(dune.getStock()).isZero();
    }

    @Test
    void fineBlockIgnoresTheCap() {
        for (int i = 0; i < LoanService.MAX_HOLDINGS; i++) {
            reserve(SAPIENS, now.plus(days(3)));
        }
        assertThat(loanService.fineBlock(user, now)).isNull();
        assertThat(loanService.borrowBlock(user, now)).isEqualTo("You already hold 8 books");

        loan(KOKORO, now.minus(days(20)), null, null);
        assertThat(loanService.fineBlock(user, now)).isEqualTo("You have an overdue book");

        loan(CHRISTIE, now.minus(days(40)), now.minus(days(20)), null);
        assertThat(loanService.fineBlock(user, now)).isEqualTo("You have unpaid fines");
    }

    private Loan reserve(String isbn, Instant reservedUntil) {
        return loanRepository.save(Loan.reserved(user, bookRepository.findById(isbn).orElseThrow(),
                reservedUntil.minus(days(LoanService.RESERVE_DAYS)), reservedUntil));
    }

    private Loan loan(String isbn, Instant borrowedAt, Instant returnedAt, Instant finePaidAt) {
        return loan(isbn, borrowedAt, returnedAt, finePaidAt, null);
    }

    private Loan loan(String isbn, Instant borrowedAt, Instant returnedAt, Instant finePaidAt,
            Instant fineForgivenAt) {
        Loan loan = new Loan(user, bookRepository.findById(isbn).orElseThrow(), borrowedAt,
                borrowedAt.plus(days(LoanService.LOAN_DAYS)));
        loan.setReturnedAt(returnedAt);
        loan.setFinePaidAt(finePaidAt);
        loan.setFineForgivenAt(fineForgivenAt);
        return loanRepository.save(loan);
    }

    private LoanResponse onlyRow() {
        HistoryResponse history = loanService.history(user);
        assertThat(history.loans()).hasSize(1);
        return history.loans().getFirst();
    }

    private static Duration days(long days) {
        return Duration.ofDays(days);
    }

    private static void assertStatus(Runnable call, HttpStatus status) {
        assertThatThrownBy(call::run)
                .isInstanceOfSatisfying(ResponseStatusException.class,
                        ex -> assertThat(ex.getStatusCode()).isEqualTo(status));
    }
}
