package com.yukunxu.data4life.user;

import java.time.Instant;

public record UserResponse(Long id, String name, String email, Instant createdAt, boolean admin) {

    public static UserResponse from(User user) {
        return new UserResponse(user.getId(), user.getName(), user.getEmail(), user.getCreatedAt(),
                user.isAdmin());
    }
}
