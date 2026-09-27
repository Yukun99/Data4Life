package com.yukunxu.data4life.notification;

import com.yukunxu.data4life.user.User;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Limit;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    @EntityGraph(attributePaths = "loan.book")
    List<Notification> findByUserOrderByIdDesc(User user, Limit limit);

    @EntityGraph(attributePaths = "loan.book")
    List<Notification> findByUserAndIdLessThanOrderByIdDesc(User user, Long id, Limit limit);

    long countByUserAndReadAtIsNull(User user);

    Optional<Notification> findByIdAndUser(Long id, User user);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("update Notification n set n.readAt = :now where n.user = :user and n.readAt is null")
    void markAllRead(@Param("user") User user, @Param("now") Instant now);

    void deleteByUser(User user);
}
