package com.example.servicemate.dto;

import com.example.servicemate.entity.Review;
import com.example.servicemate.entity.User;

import java.time.LocalDateTime;

public class ProviderReviewDTO {

    private Integer id;
    private Integer bookingId;
    private Integer userId;
    private Integer providerId;
    private Integer rating;
    private String comment;
    private String customerName;
    private LocalDateTime createdAt;

    public static ProviderReviewDTO from(Review review, User customer) {
        ProviderReviewDTO dto = new ProviderReviewDTO();
        dto.setId(review.getId());
        dto.setBookingId(review.getBookingId());
        dto.setUserId(review.getUserId());
        dto.setProviderId(review.getProviderId());
        dto.setRating(review.getRating());
        dto.setComment(review.getComment());
        dto.setCreatedAt(review.getCreatedAt());
        dto.setCustomerName(customer != null ? customer.getName() : "Customer");
        return dto;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Integer getBookingId() {
        return bookingId;
    }

    public void setBookingId(Integer bookingId) {
        this.bookingId = bookingId;
    }

    public Integer getUserId() {
        return userId;
    }

    public void setUserId(Integer userId) {
        this.userId = userId;
    }

    public Integer getProviderId() {
        return providerId;
    }

    public void setProviderId(Integer providerId) {
        this.providerId = providerId;
    }

    public Integer getRating() {
        return rating;
    }

    public void setRating(Integer rating) {
        this.rating = rating;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
