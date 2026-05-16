package com.example.servicemate.controller;

import com.example.servicemate.dto.ProviderReviewDTO;
import com.example.servicemate.dto.ReviewRequest;
import com.example.servicemate.entity.Booking;
import com.example.servicemate.entity.BookingStatus;
import com.example.servicemate.entity.Review;
import com.example.servicemate.entity.User;
import com.example.servicemate.repository.BookingRepository;
import com.example.servicemate.repository.ReviewRepository;
import com.example.servicemate.repository.UserRepository;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/reviews")
@CrossOrigin(origins = "http://localhost:5173")
public class ReviewController {

    private final ReviewRepository reviewRepository;
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;

    public ReviewController(ReviewRepository reviewRepository,
                            BookingRepository bookingRepository,
                            UserRepository userRepository) {
        this.reviewRepository = reviewRepository;
        this.bookingRepository = bookingRepository;
        this.userRepository = userRepository;
    }

    @PostMapping
    public ResponseEntity<?> createReview(@Valid @RequestBody ReviewRequest request) {
        Booking booking = bookingRepository.findById(request.getBookingId()).orElse(null);
        if (booking == null) {
            return ResponseEntity.badRequest().body("Booking not found");
        }

        if (!booking.getUserId().equals(request.getUserId()) || !booking.getProviderId().equals(request.getProviderId())) {
            return ResponseEntity.badRequest().body("Review does not match the booking");
        }

        if (booking.getStatus() != BookingStatus.CONFIRMED && booking.getStatus() != BookingStatus.COMPLETED) {
            return ResponseEntity.badRequest().body("Only confirmed or completed bookings can be reviewed");
        }

        if (reviewRepository.findByBookingId(request.getBookingId()).isPresent()) {
            return ResponseEntity.badRequest().body("Review already submitted for this booking");
        }

        Review review = new Review();
        review.setBookingId(request.getBookingId());
        review.setUserId(request.getUserId());
        review.setProviderId(request.getProviderId());
        review.setRating(request.getRating());
        review.setComment(request.getComment().trim());

        return ResponseEntity.ok(reviewRepository.save(review));
    }

    @GetMapping("/provider/{providerId}")
    public ResponseEntity<?> getProviderReviews(@PathVariable Integer providerId) {
        List<Review> reviews = reviewRepository.findByProviderIdOrderByCreatedAtDesc(providerId);
        Set<Integer> customerIds = reviews.stream()
                .map(Review::getUserId)
                .collect(Collectors.toSet());

        Map<Integer, User> customersById = userRepository.findAllById(customerIds).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));

        List<ProviderReviewDTO> response = reviews.stream()
                .map(review -> ProviderReviewDTO.from(review, customersById.get(review.getUserId())))
                .toList();

        return ResponseEntity.ok(response);
    }
}
