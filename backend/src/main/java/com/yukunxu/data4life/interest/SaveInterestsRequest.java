package com.yukunxu.data4life.interest;

import jakarta.validation.constraints.NotNull;
import java.util.List;

public record SaveInterestsRequest(@NotNull List<@NotNull Long> genreIds, @NotNull List<@NotNull Long> languageIds) {
}
