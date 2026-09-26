package com.yukunxu.data4life.catalogue;

import com.yukunxu.data4life.interest.NamedItem;
import java.util.List;

public record FilterOptions(List<String> isbn, List<String> title, List<String> author, List<NamedItem> genre,
        List<NamedItem> language, List<Integer> amount, List<Integer> stock) {
}
