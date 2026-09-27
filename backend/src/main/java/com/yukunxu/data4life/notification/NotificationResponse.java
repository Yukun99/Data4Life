package com.yukunxu.data4life.notification;

import com.yukunxu.data4life.catalogue.Book;
import java.time.Instant;

public record NotificationResponse(Long id, NotificationType type, String isbn, String title, Instant createdAt,
        boolean read) {

    public static NotificationResponse from(Notification notification) {
        Book book = notification.getLoan().getBook();
        return new NotificationResponse(notification.getId(), notification.getType(), book.getIsbn(),
                book.getTitle(), notification.getCreatedAt(), notification.getReadAt() != null);
    }
}
