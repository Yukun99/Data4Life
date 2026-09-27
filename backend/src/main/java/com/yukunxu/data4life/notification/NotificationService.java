package com.yukunxu.data4life.notification;

import com.yukunxu.data4life.loan.Loan;
import com.yukunxu.data4life.user.User;
import java.time.Instant;
import java.util.List;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Limit;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class NotificationService {

    public static final int PAGE_SIZE = 20;

    private final NotificationRepository repository;
    private final ApplicationEventPublisher events;

    public NotificationService(NotificationRepository repository, ApplicationEventPublisher events) {
        this.repository = repository;
        this.events = events;
    }

    /** Saves a notification for the loan's user and publishes it for the live stream. */
    @Transactional
    public void send(Loan loan, NotificationType type) {
        Notification saved = repository.save(new Notification(loan.getUser(), loan, type, Instant.now()));
        events.publishEvent(new NotificationCreated(loan.getUser().getId(), NotificationResponse.from(saved)));
    }

    /** Newest first, a page at a time; {@code before} is the id of the last item already shown. */
    @Transactional(readOnly = true)
    public NotificationsResponse list(User user, Long before) {
        Limit limit = Limit.of(PAGE_SIZE + 1);
        List<Notification> rows = before == null
                ? repository.findByUserOrderByIdDesc(user, limit)
                : repository.findByUserAndIdLessThanOrderByIdDesc(user, before, limit);
        return new NotificationsResponse(
                rows.stream().limit(PAGE_SIZE).map(NotificationResponse::from).toList(),
                rows.size() > PAGE_SIZE);
    }

    @Transactional(readOnly = true)
    public UnreadResponse unread(User user) {
        return new UnreadResponse(repository.countByUserAndReadAtIsNull(user));
    }

    @Transactional
    public UnreadResponse markRead(User user, Long id) {
        Notification notification = find(user, id);
        if (notification.getReadAt() == null) {
            notification.setReadAt(Instant.now());
        }
        return unread(user);
    }

    @Transactional
    public UnreadResponse markAllRead(User user) {
        repository.markAllRead(user, Instant.now());
        return unread(user);
    }

    @Transactional
    public UnreadResponse delete(User user, Long id) {
        repository.delete(find(user, id));
        return unread(user);
    }

    @Transactional
    public UnreadResponse deleteAll(User user) {
        repository.deleteByUser(user);
        return new UnreadResponse(0);
    }

    private Notification find(User user, Long id) {
        return repository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found"));
    }
}
