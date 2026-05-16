package com.example.servicemate.dto;

import lombok.Data;

@Data
public class UserDTO {
    private Integer id;
    private String name;
    private String email;
    private String password;
    private String phone;
    private String role;
    private String serviceType;
    private String city;
    private String bio;
    private Boolean availability;
    private Integer price;

    // Manual getters to be safe
    public Integer getId() { return id; }
    public String getEmail() { return email; }
    public String getPassword() { return password; }
    public String getName() { return name; }
    public String getPhone() { return phone; }
    public String getRole() { return role; }
    public String getServiceType() { return serviceType; }
    public String getCity() { return city; }
    public String getBio() { return bio; }
    public Boolean getAvailability() { return availability; }
    public Integer getPrice() { return price; }
}
