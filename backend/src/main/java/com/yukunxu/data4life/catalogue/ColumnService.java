package com.yukunxu.data4life.catalogue;

import com.yukunxu.data4life.user.User;
import com.yukunxu.data4life.user.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ColumnService {

    private final UserService userService;

    public ColumnService(UserService userService) {
        this.userService = userService;
    }

    @Transactional(readOnly = true)
    public ColumnWidths get(String email) {
        String stored = userService.getByEmail(email).getCatalogueColumns();
        return stored == null ? null : ColumnWidths.parse(stored);
    }

    @Transactional
    public ColumnWidths save(String email, ColumnWidths widths) {
        if (Math.abs(widths.total() - 100) > 0.5) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Column widths must total 100");
        }
        User user = userService.getByEmail(email);
        user.setCatalogueColumns(widths.toStored());
        return widths;
    }
}
