package com.yukunxu.data4life.admin;

import java.util.List;

public record AdminUsersResponse(List<AdminUserResponse> users, int page, int totalPages, long total,
        UserFilterOptions filters) {
}
