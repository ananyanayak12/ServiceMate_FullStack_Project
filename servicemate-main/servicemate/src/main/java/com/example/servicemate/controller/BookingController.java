package com.example.servicemate.controller;

import com.example.servicemate.dto.BookingRequest;
import com.example.servicemate.dto.BookingStatusUpdateRequest;
import com.example.servicemate.dto.CustomerBookingDTO;
import com.example.servicemate.dto.ProviderBookingDTO;
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

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/bookings")
@CrossOrigin(origins = "http://localhost:5173")
public class BookingController {

    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final ReviewRepository reviewRepository;

    public BookingController(BookingRepository bookingRepository,
                             UserRepository userRepository,
                             ReviewRepository reviewRepository) {
        this.bookingRepository = bookingRepository;
        this.userRepository = userRepository;
        this.reviewRepository = reviewRepository;
    }

    @PostMapping("/create")
    public ResponseEntity<?> createBooking(@Valid @RequestBody BookingRequest request) {
        if (!userRepository.existsById(request.getUserId())) {
            return ResponseEntity.badRequest().body("Invalid User ID");
        }

        User provider = userRepository.findById(request.getProviderId()).orElse(null);
        if (provider == null || !"provider".equalsIgnoreCase(provider.getRole())) {
            return ResponseEntity.badRequest().body("Invalid Provider ID");
        }

        if (!Boolean.TRUE.equals(provider.getAvailability())) {
            return ResponseEntity.badRequest().body("This provider is currently offline");
        }

        Booking booking = new Booking();
        booking.setUserId(request.getUserId());
        booking.setProviderId(request.getProviderId());
        booking.setDescription(request.getDescription());
        booking.setBookingDate(request.getBookingDate());
        booking.setStatus(BookingStatus.PENDING);

        return ResponseEntity.ok(bookingRepository.save(booking));
    }

    @GetMapping
    public ResponseEntity<?> getAllBookings() {
        return ResponseEntity.ok(bookingRepository.findAll());
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getBookingsByUser(@PathVariable Integer userId) {
        List<Booking> bookings = bookingRepository.findByUserId(userId);
        Set<Integer> providerIds = bookings.stream()
                .map(Booking::getProviderId)
                .collect(Collectors.toSet());

        Map<Integer, User> providersById = userRepository.findAllById(providerIds).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));
        Map<Integer, Review> reviewsByBookingId = reviewRepository.findByBookingIdIn(
                        bookings.stream().map(Booking::getId).toList()
                ).stream()
                .collect(Collectors.toMap(Review::getBookingId, Function.identity()));

        List<CustomerBookingDTO> response = bookings.stream()
                .map(booking -> CustomerBookingDTO.from(
                        booking,
                        providersById.get(booking.getProviderId()),
                        reviewsByBookingId.get(booking.getId())
                ))
                .sorted(Comparator.comparing(
                        CustomerBookingDTO::getBookingDate,
                        Comparator.nullsLast(Comparator.reverseOrder())
                ).thenComparing(CustomerBookingDTO::getId, Comparator.reverseOrder()))
                .toList();

        return ResponseEntity.ok(response);
    }

    @GetMapping("/provider/{providerId}")
    public ResponseEntity<?> getBookingsByProvider(@PathVariable Integer providerId) {
        List<Booking> bookings = bookingRepository.findByProviderId(providerId);
        Set<Integer> customerIds = bookings.stream()
                .map(Booking::getUserId)
                .collect(Collectors.toSet());

        Map<Integer, User> customersById = userRepository.findAllById(customerIds).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));

        List<ProviderBookingDTO> response = bookings.stream()
                .map(booking -> ProviderBookingDTO.from(booking, customersById.get(booking.getUserId())))
                .sorted(Comparator.comparing(
                        ProviderBookingDTO::getBookingDate,
                        Comparator.nullsLast(Comparator.reverseOrder())
                ).thenComparing(ProviderBookingDTO::getId, Comparator.reverseOrder()))
                .toList();

        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(
            @PathVariable Integer id,
            @Valid @RequestBody BookingStatusUpdateRequest request) {

        return bookingRepository.findById(id)
                .map(booking -> {
                    booking.setStatus(request.getStatus());
                    return ResponseEntity.ok(bookingRepository.save(booking));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteBooking(@PathVariable Integer id) {
        if (!bookingRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        bookingRepository.deleteById(id);
        return ResponseEntity.ok("Booking deleted successfully");
    }
}
