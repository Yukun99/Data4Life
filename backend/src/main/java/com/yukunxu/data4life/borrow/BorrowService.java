package com.yukunxu.data4life.borrow;

import com.yukunxu.data4life.catalogue.Book;
import com.yukunxu.data4life.catalogue.BookFilter;
import com.yukunxu.data4life.catalogue.BookRepository;
import com.yukunxu.data4life.catalogue.BookService;
import com.yukunxu.data4life.loan.Loan;
import com.yukunxu.data4life.loan.LoanRepository;
import com.yukunxu.data4life.loan.LoanService;
import com.yukunxu.data4life.loan.LoanStatus;
import com.yukunxu.data4life.user.User;
import com.yukunxu.data4life.user.UserService;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class BorrowService {

    private final BookService bookService;
    private final BookRepository bookRepository;
    private final LoanService loanService;
    private final LoanRepository loanRepository;
    private final UserService userService;

    public BorrowService(BookService bookService, BookRepository bookRepository, LoanService loanService,
            LoanRepository loanRepository, UserService userService) {
        this.bookService = bookService;
        this.bookRepository = bookRepository;
        this.loanService = loanService;
        this.loanRepository = loanRepository;
        this.userService = userService;
    }

    @Transactional
    public BorrowBooksResponse list(User user, BookFilter filter, int page, int size, String sort, String dir) {
        if (sort.equals("amount")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid sort");
        }
        loanService.releaseExpired();
        Page<Book> result = bookService.page(filter, page, size, sort, dir);
        Map<String, LoanStatus> holdings = loanRepository.findByUserAndReturnedAtIsNullAndReleasedAtIsNull(user)
                .stream()
                .collect(Collectors.toMap(loan -> loan.getBook().getIsbn(), BorrowService::holding, (a, b) -> a));
        String block = loanService.borrowBlock(user, Instant.now());
        return new BorrowBooksResponse(
                result.getContent().stream()
                        .map(book -> BorrowBookResponse.from(book, holdings.get(book.getIsbn())))
                        .toList(),
                result.getNumber(), result.getTotalPages(), result.getTotalElements(), bookService.filterOptions(),
                block, convertBlock(block));
    }

    @Transactional
    public BorrowBookResponse borrow(User user, String isbn) {
        loanService.releaseExpired();
        Book book = lock(isbn);
        Optional<Loan> held = holding(user, book);
        if (held.isPresent() && held.get().getBorrowedAt() != null) {
            throw conflict("You already have this book on loan");
        }
        Instant now = Instant.now();
        String block = loanService.borrowBlock(user, now);
        if (block != null && !(held.isPresent() && block.equals(LoanService.FULL_BLOCK))) {
            throw conflict(block);
        }
        Instant dueAt = now.plus(Duration.ofDays(LoanService.LOAN_DAYS));
        if (held.isPresent()) {
            held.get().setBorrowedAt(now);
            held.get().setDueAt(dueAt);
        } else {
            takeCopy(book);
            loanRepository.save(new Loan(user, book, now, dueAt));
        }
        return BorrowBookResponse.from(book, LoanStatus.BORROWED);
    }

    @Transactional
    public BorrowBookResponse reserve(User user, String isbn) {
        loanService.releaseExpired();
        Book book = lock(isbn);
        Optional<Loan> held = holding(user, book);
        if (held.isPresent()) {
            throw conflict(held.get().getBorrowedAt() != null
                    ? "You already have this book on loan" : "You already reserved this book");
        }
        Instant now = Instant.now();
        String block = loanService.borrowBlock(user, now);
        if (block != null) {
            throw conflict(block);
        }
        takeCopy(book);
        loanRepository.save(Loan.reserved(user, book, now, now.plus(Duration.ofDays(LoanService.RESERVE_DAYS))));
        return BorrowBookResponse.from(book, LoanStatus.RESERVED);
    }

    @Transactional(readOnly = true)
    public BorrowColumnWidths columns(String email) {
        String stored = userService.getByEmail(email).getBorrowColumns();
        return stored == null ? null : BorrowColumnWidths.parse(stored);
    }

    @Transactional
    public BorrowColumnWidths saveColumns(String email, BorrowColumnWidths widths) {
        if (Math.abs(widths.total() - 100) > 0.5) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Column widths must total 100");
        }
        userService.getByEmail(email).setBorrowColumns(widths.toStored());
        return widths;
    }

    private Book lock(String isbn) {
        return bookRepository.lockByIsbn(isbn)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Book not found"));
    }

    private Optional<Loan> holding(User user, Book book) {
        return loanRepository.findByUserAndReturnedAtIsNullAndReleasedAtIsNull(user).stream()
                .filter(loan -> loan.getBook().getIsbn().equals(book.getIsbn()))
                .findFirst();
    }

    private static void takeCopy(Book book) {
        if (book.getStock() <= 0) {
            throw conflict("Out of stock");
        }
        book.setStock(book.getStock() - 1);
    }

    /** The cap does not stop a reservation turning into a loan, so only fines and overdue books block that. */
    private static String convertBlock(String block) {
        return LoanService.FULL_BLOCK.equals(block) ? null : block;
    }

    private static LoanStatus holding(Loan loan) {
        return loan.getBorrowedAt() != null ? LoanStatus.BORROWED : LoanStatus.RESERVED;
    }

    private static ResponseStatusException conflict(String message) {
        return new ResponseStatusException(HttpStatus.CONFLICT, message);
    }
}
