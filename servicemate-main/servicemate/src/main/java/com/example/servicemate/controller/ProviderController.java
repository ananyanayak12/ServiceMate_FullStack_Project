package com.example.servicemate.controller;

import com.example.servicemate.entity.User;
import com.example.servicemate.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.util.StringUtils;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/providers")
@CrossOrigin(origins = "http://localhost:5173") // <-- THIS FIXES THE CONNECTION ERROR
public class ProviderController {

    @Autowired
    private UserRepository userRepository;

    private boolean matchesCity(User provider, String city) {
        if (!StringUtils.hasText(city)) {
            return true;
        }
        if (!StringUtils.hasText(provider.getCity())) {
            return false;
        }
        String normalizedCity = city.trim().toLowerCase();
        String providerCity = provider.getCity().trim().toLowerCase();
        return providerCity.contains(normalizedCity) || normalizedCity.contains(providerCity);
    }

    @GetMapping
    public List<User> getProvidersByCity(@RequestParam(required = false) String city) {
        return userRepository.findByRoleIgnoreCase("provider").stream()
                .map(provider -> {
                    if (provider.getAvailability() == null) {
                        provider.setAvailability(Boolean.TRUE);
                        return userRepository.save(provider);
                    }
                    return provider;
                })
                .filter(provider -> Boolean.TRUE.equals(provider.getAvailability()))
                .filter(provider -> matchesCity(provider, city))
                .collect(Collectors.toList());
    }

    @GetMapping("/specialty/{type}")
    public List<User> getProviders(@PathVariable String type, @RequestParam(required = false) String city) {
        return userRepository.findByRoleIgnoreCaseAndServiceTypeIgnoreCase("provider", type).stream()
                .map(provider -> {
                    if (provider.getAvailability() == null) {
                        provider.setAvailability(Boolean.TRUE);
                        return userRepository.save(provider);
                    }
                    return provider;
                })
                .filter(provider -> Boolean.TRUE.equals(provider.getAvailability()))
                .filter(provider -> matchesCity(provider, city))
                .collect(Collectors.toList());
    }
}
