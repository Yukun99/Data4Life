package com.yukunxu.data4life.notification;

import java.util.List;

public record NotificationsResponse(List<NotificationResponse> items, boolean hasMore) {
}
