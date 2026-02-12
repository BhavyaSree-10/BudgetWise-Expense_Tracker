package com.budgetwise.backend.controller;

import com.budgetwise.backend.service.OtpService;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*") // 👈 ADD THIS
public class AuthController {

    private final OtpService otpService;

    public AuthController(OtpService otpService) {
        this.otpService = otpService;
    }

    @GetMapping("/health")
    public String health() {
        return "Auth service is running";
    }

    @PostMapping("/send-otp")
    public String sendOtp(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        System.out.println("Sending OTP to: " + email);
        otpService.sendOtp(email);
        return "OTP sent successfully";
    }

    @PostMapping("/verify-otp")
    public String verifyOtp(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String otp = body.get("otp");

        boolean valid = otpService.verifyOtp(email, otp);
        return valid ? "OTP verified" : "Invalid OTP";
    }
}
