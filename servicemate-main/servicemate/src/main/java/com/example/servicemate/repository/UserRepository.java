package com.example.servicemate.repository;

import com.example.servicemate.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {
    boolean existsByEmail(String email);

    // ADD THIS LINE TO FIX THE REBUILD ERROR
    boolean existsByPhone(String phone);

    Optional<User> findByEmail(String email);

    List<User> findByRoleIgnoreCase(String role);

    List<User> findByRoleIgnoreCaseAndServiceTypeIgnoreCase(String role, String serviceType);
}
