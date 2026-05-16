package com.example.servicemate.dto;

import com.example.servicemate.entity.Booking;
import com.example.servicemate.entity.BookingStatus;
import com.example.servicemate.entity.User;

import java.time.LocalDate;

public class ProviderBookingDTO {

    private Integer id;
    private Integer userId;
    private Integer providerId;
    private String description;
    private BookingStatus status;
    private LocalDate bookingDate;
    private String customerName;
    private String customerEmail;
    private String customerPhone;
    private String customerCity;

    public static ProviderBookingDTO from(Booking booking, User customer) {
        ProviderBookingDTO dto = new ProviderBookingDTO();
        dto.setId(booking.getId());
        dto.setUserId(booking.getUserId());
        dto.setProviderId(booking.getProviderId());
        dto.setDescription(booking.getDescription());
        dto.setStatus(booking.getStatus());
        dto.setBookingDate(booking.getBookingDate());

        if (customer != null) {
            dto.setCustomerName(customer.getName());
            dto.setCustomerEmail(customer.getEmail());
            dto.setCustomerPhone(customer.getPhone());
            dto.setCustomerCity(customer.getCity());
        }

        return dto;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
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

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public BookingStatus getStatus() {
        return status;
    }

    public void setStatus(BookingStatus status) {
        this.status = status;
    }

    public LocalDate getBookingDate() {
        return bookingDate;
    }

    public void setBookingDate(LocalDate bookingDate) {
        this.bookingDate = bookingDate;
    }

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public String getCustomerEmail() {
        return customerEmail;
    }

    public void setCustomerEmail(String customerEmail) {
        this.customerEmail = customerEmail;
    }

    public String getCustomerPhone() {
        return customerPhone;
    }

    public void setCustomerPhone(String customerPhone) {
        this.customerPhone = customerPhone;
    }

    public String getCustomerCity() {
        return customerCity;
    }

    public void setCustomerCity(String customerCity) {
        this.customerCity = customerCity;
    }
}
