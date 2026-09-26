package com.yukunxu.data4life.admin;

import com.yukunxu.data4life.loan.LoanResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import java.security.Principal;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/users")
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private final AdminUserService adminUserService;

    public AdminUserController(AdminUserService adminUserService) {
        this.adminUserService = adminUserService;
    }

    @GetMapping
    public AdminUsersResponse list(@ModelAttribute UserFilter filter, @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size, @RequestParam(defaultValue = "name") String sort,
            @RequestParam(defaultValue = "asc") String dir, Principal principal) {
        return adminUserService.list(principal.getName(), filter, page, size, sort, dir);
    }

    @PostMapping("/{id}/promote")
    public AdminUserResponse promote(@PathVariable Long id, Principal principal) {
        return adminUserService.promote(principal.getName(), id);
    }

    @PostMapping("/{id}/demote")
    public AdminUserResponse demote(@PathVariable Long id, Principal principal) {
        return adminUserService.demote(principal.getName(), id);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id, Principal principal) {
        adminUserService.delete(principal.getName(), id);
    }

    @GetMapping("/{id}/fines")
    public List<LoanResponse> fines(@PathVariable Long id) {
        return adminUserService.fines(id);
    }

    @PostMapping("/{id}/loans/{loanId}/forgive")
    public List<LoanResponse> forgive(@PathVariable Long id, @PathVariable Long loanId) {
        return adminUserService.forgive(id, loanId);
    }

    @GetMapping("/columns")
    public UserColumnWidths columns(Principal principal) {
        return adminUserService.columns(principal.getName());
    }

    @PutMapping("/columns")
    public UserColumnWidths saveColumns(@Valid @RequestBody UserColumnWidths widths, Principal principal) {
        return adminUserService.saveColumns(principal.getName(), widths);
    }
}
