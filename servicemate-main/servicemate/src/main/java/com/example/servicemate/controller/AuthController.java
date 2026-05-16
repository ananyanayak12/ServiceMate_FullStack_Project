package com.example.servicemate.controller;

import com.example.servicemate.entity.User;
import com.example.servicemate.dto.UserDTO;
import com.example.servicemate.repository.UserRepository;
import com.example.servicemate.security.JwtUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:5173")
public class AuthController {

    @Autowired private UserRepository userRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private JavaMailSender mailSender;
    @Autowired private JwtUtils jwtUtils;

    private static class OtpData {
        String otp;
        long expiryTime;
        OtpData(String otp, long expiryTime) { this.otp = otp; this.expiryTime = expiryTime; }
    }

    private Map<String, OtpData> otpCache = new HashMap<>();

    private User ensureProviderAvailability(User user) {
        if ("provider".equalsIgnoreCase(user.getRole()) && user.getAvailability() == null) {
            user.setAvailability(Boolean.TRUE);
            return userRepository.save(user);
        }
        return user;
    }

    private String normalizeName(String value) {
        if (value == null) {
            return "";
        }
        String trimmed = value.trim().replaceAll("\\s+", " ");
        if (trimmed.isEmpty()) {
            return "";
        }
        String[] parts = trimmed.split(" ");
        StringBuilder normalized = new StringBuilder();
        for (int i = 0; i < parts.length; i++) {
            String part = parts[i];
            if (part.isEmpty()) {
                continue;
            }
            if (normalized.length() > 0) {
                normalized.append(' ');
            }
            normalized.append(part.substring(0, 1).toUpperCase());
            if (part.length() > 1) {
                normalized.append(part.substring(1).toLowerCase());
            }
        }
        return normalized.toString();
    }

    // 1. SEND OTP FOR SIGNUP
    @PostMapping("/signup-otp")
    public ResponseEntity<?> sendSignupOtp(@RequestBody Map<String, String> request) {
        String email = request.get("email").toLowerCase().trim();
        if (userRepository.existsByEmail(email)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Email already registered!");
        }
        String otp = String.format("%06d", new Random().nextInt(999999));
        otpCache.put(email, new OtpData(otp, System.currentTimeMillis() + 60000));
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject("Verify your ServiceMate Account");
        message.setText("Your verification code is: " + otp);
        mailSender.send(message);
        return ResponseEntity.ok("Verification code sent!");
    }

    // 2. REGISTER USER (Manual Signup)
    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@RequestBody UserDTO userDTO) {
        String email = userDTO.getEmail().toLowerCase().trim();
        if (userRepository.existsByEmail(email)) return ResponseEntity.status(400).body("Email in use!");
        String normalizedName = normalizeName(userDTO.getName());
        String trimmedCity = userDTO.getCity() == null ? "" : userDTO.getCity().trim();
        if (normalizedName.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Name is required");
        }

        User user = new User();
        user.setName(normalizedName);
        user.setEmail(email);
        user.setPhone(userDTO.getPhone());
        user.setRole(userDTO.getRole().toLowerCase());
        user.setPassword(passwordEncoder.encode(userDTO.getPassword()));
        if ("provider".equals(user.getRole())) {
            if (trimmedCity.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("City is required for providers");
            }
            user.setServiceType(userDTO.getServiceType());
            user.setAvailability(Boolean.TRUE);
        }
        user.setCity(trimmedCity.isEmpty() ? null : trimmedCity);
        user.setBio(userDTO.getBio());

        userRepository.save(user);
        return ResponseEntity.ok("User registered successfully!");
    }

    // 3. LOGIN (Standard)
    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@RequestBody UserDTO loginDTO) {
        String email = loginDTO.getEmail().toLowerCase().trim();
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isPresent() && passwordEncoder.matches(loginDTO.getPassword(), userOpt.get().getPassword())) {
            String token = jwtUtils.generateToken(email);
            User user = ensureProviderAvailability(userOpt.get());
            Map<String, Object> response = new HashMap<>();
            response.put("token", token);
            response.put("user", user);
            return ResponseEntity.ok(response);
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid Credentials");
    }

    // 4. GOOGLE LOGIN
    // --- GOOGLE LOGIN (Identity Verification Only) ---
    @PostMapping("/google-login")
    public ResponseEntity<?> googleLogin(@RequestBody Map<String, String> request) {
        String email = request.get("email").toLowerCase().trim();

        // 1. Check if user exists in DB
        Optional<User> userOpt = userRepository.findByEmail(email);

        // 2. If not found, DO NOT create account. Send error to Frontend.
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Account not found. Please sign up with your phone number first!");
        }

        // 3. User exists, so we have their phone number and role already.
        User user = ensureProviderAvailability(userOpt.get());
        String token = jwtUtils.generateToken(email);

        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("user", user);
        return ResponseEntity.ok(response);
    }

    // 5. FORGOT PASSWORD
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> request) {
        String email = request.get("email").toLowerCase().trim();
        if (!userRepository.existsByEmail(email)) return ResponseEntity.status(404).body("User not found");
        String otp = String.format("%06d", new Random().nextInt(999999));
        otpCache.put(email, new OtpData(otp, System.currentTimeMillis() + 60000));
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject("ServiceMate OTP");
        message.setText("Your OTP: " + otp);
        mailSender.send(message);
        return ResponseEntity.ok("OTP Sent");
    }

    // 6. VERIFY OTP
    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody Map<String, String> request) {
        String email = request.get("email").toLowerCase().trim();
        String otp = request.get("otp");
        OtpData cached = otpCache.get(email);
        if (cached != null && System.currentTimeMillis() < cached.expiryTime && cached.otp.equals(otp)) {
            return ResponseEntity.ok("Verified");
        }
        return ResponseEntity.status(401).body("Invalid or Expired OTP");
    }

    // 7. RESET PASSWORD
    @PostMapping("/reset-password")
    @Transactional
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        String email = request.get("email").toLowerCase().trim();
        Optional<User> user = userRepository.findByEmail(email);
        if (user.isPresent()) {
            user.get().setPassword(passwordEncoder.encode(request.get("password")));
            userRepository.save(user.get());
            otpCache.remove(email);
            return ResponseEntity.ok("Password Reset Successful");
        }
        return ResponseEntity.status(404).body("Error");
    }

    @GetMapping("/profile/{id}")
    public ResponseEntity<?> getProfile(@PathVariable Integer id) {
        return userRepository.findById(id)
                .map(this::ensureProviderAvailability)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found"));
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@RequestBody UserDTO profileDTO) {
        if (profileDTO.getId() == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("User id is required");
        }

        Optional<User> userOpt = userRepository.findById(profileDTO.getId());
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
        }

        User user = userOpt.get();

        String trimmedName = normalizeName(profileDTO.getName());
        String trimmedPhone = profileDTO.getPhone() == null ? "" : profileDTO.getPhone().trim();
        String trimmedServiceType = profileDTO.getServiceType() == null ? null : profileDTO.getServiceType().trim();
        String trimmedCity = profileDTO.getCity() == null ? null : profileDTO.getCity().trim();
        String trimmedBio = profileDTO.getBio() == null ? null : profileDTO.getBio().trim();

        if (trimmedName.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Name is required");
        }

        if (!trimmedPhone.matches("\\d{10}")) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Phone must be 10 digits");
        }

        if (!trimmedPhone.equals(user.getPhone()) && userRepository.existsByPhone(trimmedPhone)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Phone already in use");
        }

        user.setName(trimmedName);
        user.setPhone(trimmedPhone);
        user.setCity(trimmedCity);
        user.setBio(trimmedBio);
        if (profileDTO.getPrice() != null) {
            user.setPrice(profileDTO.getPrice());
        }

        if ("provider".equalsIgnoreCase(user.getRole())) {
            if (trimmedServiceType == null || trimmedServiceType.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Service type is required");
            }
            if (trimmedCity == null || trimmedCity.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("City is required for providers");
            }
            user.setServiceType(trimmedServiceType);
            if (profileDTO.getAvailability() != null) {
                user.setAvailability(profileDTO.getAvailability());
            }
        }

        userRepository.save(user);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Profile updated successfully");
        response.put("user", user);
        return ResponseEntity.ok(response);
    }
}
