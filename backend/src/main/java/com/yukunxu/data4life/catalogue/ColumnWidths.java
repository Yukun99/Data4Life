package com.yukunxu.data4life.catalogue;

import jakarta.validation.constraints.DecimalMin;
import java.util.Arrays;

public record ColumnWidths(
        @DecimalMin("5") double isbn,
        @DecimalMin("5") double titleAuthor,
        @DecimalMin("5") double genreLanguage,
        @DecimalMin("5") double amount,
        @DecimalMin("5") double stock,
        @DecimalMin("5") double actions) {

    public double total() {
        return isbn + titleAuthor + genreLanguage + amount + stock + actions;
    }

    /** Stored as six comma separated percentages in column order. */
    public String toStored() {
        return isbn + "," + titleAuthor + "," + genreLanguage + "," + amount + "," + stock + "," + actions;
    }

    public static ColumnWidths parse(String stored) {
        double[] v = Arrays.stream(stored.split(",")).mapToDouble(Double::parseDouble).toArray();
        return new ColumnWidths(v[0], v[1], v[2], v[3], v[4], v[5]);
    }
}
