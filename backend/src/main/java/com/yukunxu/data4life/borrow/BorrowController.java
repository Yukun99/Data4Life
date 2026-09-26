package com.yukunxu.data4life.borrow;

import com.yukunxu.data4life.catalogue.BookFilter;
import com.yukunxu.data4life.user.User;
import com.yukunxu.data4life.user.UserService;
import jakarta.validation.Valid;
import java.security.Principal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/borrow")
public class BorrowController {

    private final BorrowService borrowService;
    private final UserService userService;

    public BorrowController(BorrowService borrowService, UserService userService) {
        this.borrowService = borrowService;
        this.userService = userService;
    }

    @GetMapping
    public BorrowBooksResponse list(@ModelAttribute BookFilter filter,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "title") String sort,
            @RequestParam(defaultValue = "asc") String dir,
            Principal principal) {
        return borrowService.list(currentUser(principal), filter, page, size, sort, dir);
    }

    @GetMapping("/columns")
    public BorrowColumnWidths columns(Principal principal) {
        return borrowService.columns(principal.getName());
    }

    @PutMapping("/columns")
    public BorrowColumnWidths saveColumns(@Valid @RequestBody BorrowColumnWidths widths, Principal principal) {
        return borrowService.saveColumns(principal.getName(), widths);
    }

    @PostMapping("/{isbn}")
    public BorrowBookResponse borrow(@PathVariable String isbn, Principal principal) {
        return borrowService.borrow(currentUser(principal), isbn);
    }

    @PostMapping("/{isbn}/reserve")
    public BorrowBookResponse reserve(@PathVariable String isbn, Principal principal) {
        return borrowService.reserve(currentUser(principal), isbn);
    }

    private User currentUser(Principal principal) {
        return userService.getByEmail(principal.getName());
    }
}
