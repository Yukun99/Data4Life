package com.yukunxu.data4life.loan;

import com.yukunxu.data4life.user.User;
import com.yukunxu.data4life.user.UserService;
import java.security.Principal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/loans")
public class LoanController {

    private final LoanService loanService;
    private final UserService userService;

    public LoanController(LoanService loanService, UserService userService) {
        this.loanService = loanService;
        this.userService = userService;
    }

    @GetMapping
    public HistoryResponse history(Principal principal) {
        return loanService.history(currentUser(principal));
    }

    @PostMapping("/{id}/pay")
    public HistoryResponse pay(@PathVariable Long id, Principal principal) {
        User user = currentUser(principal);
        loanService.pay(user, id);
        return loanService.history(user);
    }

    @PostMapping("/pay-all")
    public HistoryResponse payAll(Principal principal) {
        User user = currentUser(principal);
        loanService.payAll(user);
        return loanService.history(user);
    }

    private User currentUser(Principal principal) {
        return userService.getByEmail(principal.getName());
    }
}
