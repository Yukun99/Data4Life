package com.yukunxu.data4life.loan;

import java.math.BigDecimal;
import java.time.Instant;

public record LoanResponse(Long id, String isbn, String title, String author, String genre, Instant borrowedAt,
        Instant dueAt, Instant returnedAt, LoanStatus status, long overdueDays, BigDecimal fine, Instant reservedAt,
        Instant reservedUntil, BigDecimal fee) {
}
