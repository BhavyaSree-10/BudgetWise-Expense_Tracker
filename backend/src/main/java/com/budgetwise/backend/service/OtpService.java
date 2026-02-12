package com.budgetwise.backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class OtpService {

    @Autowired
    private JavaMailSender mailSender;

    // Store OTP + expiry time
    private final Map<String, OtpData> otpStore = new ConcurrentHashMap<>();

    // ================= SEND OTP =================
    public void sendOtp(String email) {

        String otp = String.valueOf(100000 + new Random().nextInt(900000));
        LocalDateTime expiryTime = LocalDateTime.now().plusMinutes(5);

        otpStore.put(email, new OtpData(otp, expiryTime));

        System.out.println("Sending OTP to: " + email);
        System.out.println("OTP GENERATED: " + otp);

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject("Your BudgetWise OTP");
        message.setText("Your OTP is: " + otp + "\nValid for 5 minutes.");

        mailSender.send(message);

        System.out.println("MAIL SENT THROUGH GMAIL SMTP");
    }

    // ================= VERIFY OTP =================
    public boolean verifyOtp(String email, String otp) {

        if (!otpStore.containsKey(email)) {
            return false;
        }

        OtpData otpData = otpStore.get(email);

        if (otpData.getExpiryTime().isBefore(LocalDateTime.now())) {
            otpStore.remove(email);
            return false;
        }

        if (otpData.getOtp().equals(otp)) {
            otpStore.remove(email); // OTP used → remove
            return true;
        }

        return false;
    }

    // ================= INNER CLASS =================
    private static class OtpData {
        private final String otp;
        private final LocalDateTime expiryTime;

        public OtpData(String otp, LocalDateTime expiryTime) {
            this.otp = otp;
            this.expiryTime = expiryTime;
        }

        public String getOtp() {
            return otp;
        }

        public LocalDateTime getExpiryTime() {
            return expiryTime;
        }
    }
}
