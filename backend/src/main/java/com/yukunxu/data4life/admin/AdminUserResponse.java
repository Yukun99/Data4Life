package com.yukunxu.data4life.admin;

import java.math.BigDecimal;
import java.time.Instant;

public record AdminUserResponse(Long id, String name, String email, Instant createdAt, boolean admin,
        int totalBorrows, int currentBorrows, BigDecimal totalFines, BigDecimal currentFines, boolean demotable,
        boolean deletable) {
}
