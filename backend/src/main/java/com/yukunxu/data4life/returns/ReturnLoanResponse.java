package com.yukunxu.data4life.returns;

import com.yukunxu.data4life.catalogue.Book;
import com.yukunxu.data4life.interest.NamedItem;
import com.yukunxu.data4life.loan.Loan;
import com.yukunxu.data4life.loan.LoanService;
import com.yukunxu.data4life.loan.LoanStatus;
import java.math.BigDecimal;
import java.time.Instant;

public record ReturnLoanResponse(Long id, String isbn, String title, String author, NamedItem genre,
        NamedItem language, LoanStatus status, Instant dueAt, Instant returnedAt, Instant reservedUntil,
        long overdueDays, BigDecimal fine, Integer queuePosition) {

    public static ReturnLoanResponse from(Loan loan, Instant now, Integer queuePosition) {
        Book book = loan.getBook();
        Instant end = loan.getReturnedAt() == null ? now : loan.getReturnedAt();
        long overdueDays = loan.getDueAt() == null ? 0 : LoanService.overdueDays(loan.getDueAt(), end);
        return new ReturnLoanResponse(loan.getId(), book.getIsbn(), book.getTitle(), book.getAuthor(),
                new NamedItem(book.getGenre().getId(), book.getGenre().getName()),
                new NamedItem(book.getLanguage().getId(), book.getLanguage().getName()),
                LoanService.status(loan, now), loan.getDueAt(), loan.getReturnedAt(), loan.getReservedUntil(),
                overdueDays, LoanService.fine(loan, now), queuePosition);
    }

    /** The date a row sorts by: the due date of a loan or the end of a reservation; null while queued. */
    public Instant until() {
        return dueAt != null ? dueAt : reservedUntil;
    }
}
