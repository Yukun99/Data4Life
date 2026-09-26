package com.yukunxu.data4life.interest;

import java.util.List;

public record InterestsResponse(List<NamedItem> genres, List<NamedItem> languages, boolean prompted) {
}
