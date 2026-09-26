package com.yukunxu.data4life.loan;

import java.math.BigDecimal;

public record HistoryStats(long booksBorrowed, String favouriteGenre, String favouriteAuthor,
        BigDecimal totalOverdueFines) {
}
