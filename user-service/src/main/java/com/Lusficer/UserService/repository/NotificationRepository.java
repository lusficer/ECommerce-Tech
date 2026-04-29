package com.Lusficer.UserService.repository;

import com.Lusficer.UserService.entity.Notification;
import com.Lusficer.UserService.enums.NotificationType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    
    /**
     * Find all unread notifications for a user, sorted by creation time descending
     */
    List<Notification> findByUserIdAndIsReadFalseOrderByCreatedAtDesc(String userId);
    
    /**
     * Find all notifications for a user with pagination, sorted by creation time descending
     */
    Page<Notification> findByUserIdOrderByCreatedAtDesc(String userId, Pageable pageable);
    
    /**
     * Count total unread notifications for a user
     */
    Long countByUserIdAndIsReadFalse(String userId);
    
    /**
     * Get count of unread notifications grouped by type
     */
    @Query("SELECT n.type, COUNT(n) FROM Notification n WHERE n.userId = :userId AND n.isRead = false GROUP BY n.type")
    List<Object[]> countByTypeForUser(@Param("userId") String userId);
    
    /**
     * Mark all unread notifications as read for a user
     */
    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.userId = :userId AND n.isRead = false")
    void markAllAsRead(@Param("userId") String userId);
    
    /**
     * Mark a specific notification as read (with user verification)
     */
    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.notificationId = :id AND n.userId = :userId")
    int markAsRead(@Param("id") Long id, @Param("userId") String userId);
}
