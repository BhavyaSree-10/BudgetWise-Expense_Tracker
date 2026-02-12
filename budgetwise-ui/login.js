// ===============================
// OTP INPUT BEHAVIOR (Focus switching)
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  const boxes = document.querySelectorAll(".otp-box");

  boxes.forEach((box, index) => {
    box.value = ""; // Clear on load

    box.addEventListener("input", () => {
      // Allow only numbers
      if (!/^[0-9]$/.test(box.value)) {
        box.value = "";
        return;
      }
      // Move to next box
      if (index < boxes.length - 1) {
        boxes[index + 1].focus();
      }
    });

    box.addEventListener("keydown", (e) => {
      // Backspace logic
      if (e.key === "Backspace" && box.value === "" && index > 0) {
        boxes[index - 1].focus();
      }
    });
  });
});

// ===============================
// SEND OTP LOGIC (New)
// ===============================
function handleSendOtp() {
  const emailInput = document.getElementById("userEmailInput").value;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;

  if (!emailRegex.test(emailInput)) {
    alert("Please enter a valid gmail address (example@gmail.com)");
    return;
  }

  // Store the email for the dashboard session
  localStorage.setItem("tempEmail", emailInput);
  
  // Show the email in the next section
  document.getElementById("confirmEmail").innerText = emailInput;

  // Switch from Email Input to OTP Input
  document.getElementById("emailSection").style.display = "none";
  document.getElementById("otpSection").style.display = "block";
  
  // SIMULATION: Since we have no backend, we "alert" the code
  alert("Your test OTP is: 123456");
}

// ===============================
// VERIFY OTP & REDIRECT
// ===============================
// ✅ Corrected Verify Function for your Backend
async function verifyOtp() {
  const msg = document.getElementById("msg");
  const boxes = document.querySelectorAll(".otp-box");
  const email = localStorage.getItem("tempEmail"); // Retrieve the email stored during sendOtp

  let otp = "";
  boxes.forEach(b => otp += b.value);

  if (otp.length !== 6) {
    msg.style.color = "red";
    msg.innerText = "Please enter full 6-digit OTP";
    return;
  }

  try {
    // 1. Call your actual backend to verify
    const response = await fetch("http://localhost:8080/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email, otp: otp })
    });

    if (response.ok) {
      // ✅ SUCCESS: The backend verified the code
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("loggedInEmail", email); // For dashboard display
      
      localStorage.removeItem("tempEmail");
      window.location.replace("../dashboard.html");
    } else {
      // ❌ FAIL: The backend rejected the code
      const errorData = await response.json();
      msg.style.color = "red";
      msg.innerText = errorData.message || "Invalid OTP. Please try again.";
    }
  } catch (error) {
    msg.style.color = "red";
    msg.innerText = "Connection error. Is the backend running?";
  }
}