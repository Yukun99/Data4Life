package com.yukunxu.data4life.catalogue;

import jakarta.validation.Valid;
import java.security.Principal;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/catalogue/columns")
@PreAuthorize("hasRole('ADMIN')")
public class ColumnController {

    private final ColumnService columnService;

    public ColumnController(ColumnService columnService) {
        this.columnService = columnService;
    }

    @GetMapping
    public ColumnWidths get(Principal principal) {
        return columnService.get(principal.getName());
    }

    @PutMapping
    public ColumnWidths save(@Valid @RequestBody ColumnWidths widths, Principal principal) {
        return columnService.save(principal.getName(), widths);
    }
}
