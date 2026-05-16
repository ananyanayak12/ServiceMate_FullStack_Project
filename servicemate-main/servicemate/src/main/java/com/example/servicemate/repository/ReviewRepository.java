package com.example.servicemate.repository;

import com.example.servicemate.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ReviewRepository extends JpaRepository<Review, Integer> {

    List<Review> findByProviderIdOrderByCreatedAtDesc(Integer providerId);

    Optional<Review> findByBookingId(Integer bookingId);

    List<Review> findByBookingIdIn(List<Integer> bookingIds);
}
