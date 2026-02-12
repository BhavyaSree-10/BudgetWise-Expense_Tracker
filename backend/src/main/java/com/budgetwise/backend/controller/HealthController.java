package com.budgetwise.backend.controller;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:3000")
public class HealthController {

    @GetMapping("/health")
    public String health() {
        return "Backend is running successfully 🚀";
    }

    @GetMapping("/hello")
    public String hello() {
        return "Hello from Spring Boot Backend";
    }
}
