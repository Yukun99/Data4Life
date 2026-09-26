package com.yukunxu.data4life.admin;

import java.math.BigDecimal;
import java.util.List;

public record UserFilterOptions(List<String> name, List<String> email, List<Boolean> admin,
        List<Integer> totalBorrows, List<Integer> currentBorrows, List<BigDecimal> totalFines,
        List<BigDecimal> currentFines) {
}
