package com.yukunxu.data4life.notification;

import com.yukunxu.data4life.user.User;
import com.yukunxu.data4life.user.UserService;
import java.security.Principal;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;
    private final NotificationStream stream;
    private final UserService userService;

    public NotificationController(NotificationService notificationService, NotificationStream stream,
            UserService userService) {
        this.notificationService = notificationService;
        this.stream = stream;
        this.userService = userService;
    }

    @GetMapping
    public NotificationsResponse list(@RequestParam(required = false) Long before, Principal principal) {
        return notificationService.list(currentUser(principal), before);
    }

    @GetMapping("/unread")
    public UnreadResponse unread(Principal principal) {
        return notificationService.unread(currentUser(principal));
    }

    @PostMapping("/{id}/read")
    public UnreadResponse markRead(@PathVariable Long id, Principal principal) {
        return notificationService.markRead(currentUser(principal), id);
    }

    @PostMapping("/read-all")
    public UnreadResponse markAllRead(Principal principal) {
        return notificationService.markAllRead(currentUser(principal));
    }

    @DeleteMapping("/{id}")
    public UnreadResponse delete(@PathVariable Long id, Principal principal) {
        return notificationService.delete(currentUser(principal), id);
    }

    @DeleteMapping
    public UnreadResponse deleteAll(Principal principal) {
        return notificationService.deleteAll(currentUser(principal));
    }

    @GetMapping(path = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public ResponseEntity<SseEmitter> stream(Principal principal) {
        return ResponseEntity.ok()
                .header("X-Accel-Buffering", "no")
                .body(stream.subscribe(currentUser(principal).getId()));
    }

    private User currentUser(Principal principal) {
        return userService.getByEmail(principal.getName());
    }
}
