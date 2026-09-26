package com.yukunxu.data4life.admin;

import java.math.BigDecimal;

public record UserFilter(String name, String email, Boolean admin, Integer totalBorrows, Integer currentBorrows,
        BigDecimal totalFines, BigDecimal currentFines) {
}
