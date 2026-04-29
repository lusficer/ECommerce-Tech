package com.Lusficer.UserService.repository;

import com.Lusficer.UserService.entity.UserProfile;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserProfileRepository extends JpaRepository<UserProfile, String> {
    Optional<UserProfile> findByEmail(String email);
    Optional<UserProfile> findByUserId(String userId);
    long countByUserIdStartingWith(String prefix);

    @Query("""
      SELECT DISTINCT p FROM UserProfile p
      LEFT JOIN UserRole r ON r.userId = p.userId
      LEFT JOIN UserStatus s ON s.userId = p.userId
      WHERE (:role IS NULL OR LOWER(CONCAT('', r.roleName)) = LOWER(:role))
        AND (:isBanned IS NULL OR COALESCE(s.isBanned, false) = :isBanned)
        AND (:search IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%'))
             OR LOWER(p.email) LIKE LOWER(CONCAT('%', :search, '%')))
      ORDER BY p.createdAt DESC
    """)
    Page<UserProfile> searchUsersForAdmin(
        @Param("role") String role,
        @Param("isBanned") Boolean isBanned,
        @Param("search") String search,
        Pageable pageable);
}
