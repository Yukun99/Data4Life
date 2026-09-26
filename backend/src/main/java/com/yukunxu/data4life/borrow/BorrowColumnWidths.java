package com.yukunxu.data4life.borrow;

import jakarta.validation.constraints.DecimalMin;
import java.util.Arrays;

public record BorrowColumnWidths(
        @DecimalMin("5") double isbn,
        @DecimalMin("5") double titleAuthor,
        @DecimalMin("5") double genreLanguage,
        @DecimalMin("5") double stock,
        @DecimalMin("5") double actions) {

    public double total() {
        return isbn + titleAuthor + genreLanguage + stock + actions;
    }

    /** Stored as five comma separated percentages in column order. */
    public String toStored() {
        return isbn + "," + titleAuthor + "," + genreLanguage + "," + stock + "," + actions;
    }

    public static BorrowColumnWidths parse(String stored) {
        double[] v = Arrays.stream(stored.split(",")).mapToDouble(Double::parseDouble).toArray();
        return new BorrowColumnWidths(v[0], v[1], v[2], v[3], v[4]);
    }
}
