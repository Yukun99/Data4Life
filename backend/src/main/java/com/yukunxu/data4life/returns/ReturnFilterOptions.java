package com.yukunxu.data4life.returns;

import com.yukunxu.data4life.interest.NamedItem;
import java.util.List;

public record ReturnFilterOptions(List<String> isbn, List<String> title, List<String> author, List<NamedItem> genre,
        List<NamedItem> language) {
}
