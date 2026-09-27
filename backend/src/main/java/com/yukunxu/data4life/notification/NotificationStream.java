package com.yukunxu.data4life.notification;

import java.io.IOException;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter.SseEventBuilder;

@Component
public class NotificationStream {

    static final long TIMEOUT = Duration.ofMinutes(30).toMillis();

    private final Map<Long, CopyOnWriteArrayList<SseEmitter>> emitters = new ConcurrentHashMap<>();

    public SseEmitter subscribe(Long userId) {
        return add(userId, new SseEmitter(TIMEOUT));
    }

    /** Pushes a new notification to the user's open streams once its transaction has committed. */
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onCreated(NotificationCreated event) {
        for (SseEmitter emitter : emitters.getOrDefault(event.userId(), new CopyOnWriteArrayList<>())) {
            send(event.userId(), emitter, SseEmitter.event().name("notification").data(event.notification()));
        }
    }

    /** Keeps idle connections open through proxies that close silent ones. */
    @Scheduled(fixedDelayString = "PT25S")
    public void ping() {
        emitters.forEach((userId, list) -> list.forEach(emitter ->
                send(userId, emitter, SseEmitter.event().comment("ping"))));
    }

    SseEmitter add(Long userId, SseEmitter emitter) {
        emitters.compute(userId, (id, list) -> {
            CopyOnWriteArrayList<SseEmitter> open = list == null ? new CopyOnWriteArrayList<>() : list;
            open.add(emitter);
            return open;
        });
        emitter.onCompletion(() -> remove(userId, emitter));
        emitter.onTimeout(() -> remove(userId, emitter));
        emitter.onError(error -> remove(userId, emitter));
        return emitter;
    }

    List<SseEmitter> open(Long userId) {
        return List.copyOf(emitters.getOrDefault(userId, new CopyOnWriteArrayList<>()));
    }

    private void send(Long userId, SseEmitter emitter, SseEventBuilder event) {
        try {
            emitter.send(event);
        } catch (IOException | IllegalStateException ex) {
            remove(userId, emitter);
        }
    }

    private void remove(Long userId, SseEmitter emitter) {
        emitters.computeIfPresent(userId, (id, list) -> {
            list.remove(emitter);
            return list.isEmpty() ? null : list;
        });
    }
}
