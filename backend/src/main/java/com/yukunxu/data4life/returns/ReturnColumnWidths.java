package com.yukunxu.data4life.returns;

import jakarta.validation.constraints.DecimalMin;
import java.util.Arrays;

public record ReturnColumnWidths(
        @DecimalMin("5") double isbn,
        @DecimalMin("5") double titleAuthor,
        @DecimalMin("5") double genreLanguage,
        @DecimalMin("5") double status,
        @DecimalMin("5") double actions) {

    public double total() {
        return isbn + titleAuthor + genreLanguage + status + actions;
    }

    /** Stored as five comma separated percentages in column order. */
    public String toStored() {
        return isbn + "," + titleAuthor + "," + genreLanguage + "," + status + "," + actions;
    }

    public static ReturnColumnWidths parse(String stored) {
        double[] v = Arrays.stream(stored.split(",")).mapToDouble(Double::parseDouble).toArray();
        return new ReturnColumnWidths(v[0], v[1], v[2], v[3], v[4]);
    }
}
