package com.yukunxu.data4life.admin;

import jakarta.validation.constraints.DecimalMin;
import java.util.Arrays;

public record UserColumnWidths(
        @DecimalMin("5") double nameEmail,
        @DecimalMin("5") double admin,
        @DecimalMin("5") double joined,
        @DecimalMin("5") double borrows,
        @DecimalMin("5") double fines,
        @DecimalMin("5") double actions) {

    public double total() {
        return nameEmail + admin + joined + borrows + fines + actions;
    }

    /** Stored as six comma separated percentages in column order. */
    public String toStored() {
        return nameEmail + "," + admin + "," + joined + "," + borrows + "," + fines + "," + actions;
    }

    public static UserColumnWidths parse(String stored) {
        double[] v = Arrays.stream(stored.split(",")).mapToDouble(Double::parseDouble).toArray();
        return new UserColumnWidths(v[0], v[1], v[2], v[3], v[4], v[5]);
    }
}
