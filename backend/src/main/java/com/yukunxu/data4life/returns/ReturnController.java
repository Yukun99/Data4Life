package com.yukunxu.data4life.returns;

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
@RequestMapping("/api/return")
public class ReturnController {

    private final ReturnService returnService;
    private final UserService userService;

    public ReturnController(ReturnService returnService, UserService userService) {
        this.returnService = returnService;
        this.userService = userService;
    }

    @GetMapping
    public ReturnLoansResponse list(@ModelAttribute ReturnFilter filter,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "due") String sort,
            @RequestParam(defaultValue = "asc") String dir,
            Principal principal) {
        return returnService.list(currentUser(principal), filter, page, size, sort, dir);
    }

    @GetMapping("/columns")
    public ReturnColumnWidths columns(Principal principal) {
        return returnService.columns(principal.getName());
    }

    @PutMapping("/columns")
    public ReturnColumnWidths saveColumns(@Valid @RequestBody ReturnColumnWidths widths, Principal principal) {
        return returnService.saveColumns(principal.getName(), widths);
    }

    @PostMapping("/{loanId}")
    public ReturnLoanResponse returnLoan(@PathVariable Long loanId, Principal principal) {
        return returnService.returnLoan(currentUser(principal), loanId);
    }

    @PostMapping("/{loanId}/unreserve")
    public ReturnLoanResponse unreserve(@PathVariable Long loanId, Principal principal) {
        return returnService.unreserve(currentUser(principal), loanId);
    }

    private User currentUser(Principal principal) {
        return userService.getByEmail(principal.getName());
    }
}
