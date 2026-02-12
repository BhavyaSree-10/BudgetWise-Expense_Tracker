// ✅ Your Backend Base URL
const BASE_URL = "http://localhost:8080/api/auth"; 

/**
 * PHASE 1: SENDING THE OTP
 * This connects to your localhost:8080/api/auth/send-otp endpoint.
 */
async function sendOtp() {
  const emailInput = document.getElementById("userEmailInput").value;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;

  // Validate email format before sending to backend
  if (!emailInput || !emailRegex.test(emailInput)) {
    alert("Please enter a valid Gmail address.");
    return;
  }

  try {
    // 1. POST request to your backend
    const response = await fetch("http://localhost:8080/api/auth/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: emailInput })
    });

    if (response.ok) {
      // 2. Store the email so the next step knows which user to verify
      localStorage.setItem("tempEmail", emailInput);
      
      // 3. UI Transition: Switch from Email Input to OTP boxes
      document.getElementById("emailSection").style.display = "none";
      document.getElementById("otpSection").style.display = "block";
      
      // Display the email the user just typed for confirmation
      const displayEmail = document.getElementById("confirmEmail");
      if (displayEmail) displayEmail.innerText = emailInput;

      console.log("Backend confirmed: OTP Sent.");
    } else {
      const errorData = await response.json();
      alert("Server Error: " + (errorData.message || "Could not send OTP."));
    }
  } catch (error) {
    console.error("Connection Error:", error);
    alert("Cannot connect to backend. Is your server running on port 8080?");
  }
}

/**
 * PHASE 2: VERIFYING THE OTP
 * This connects to your localhost:8080/api/auth/verify-otp endpoint.
 */
async function verifyOtp() {
  const email = localStorage.getItem("tempEmail");
  const boxes = document.querySelectorAll(".otp-box");
  const msg = document.getElementById("msg");

  // Combine the 6 individual boxes into one string
  let otpCode = "";
  boxes.forEach(b => otpCode += b.value);

  if (otpCode.length !== 6) {
    msg.innerText = "Please enter the full 6-digit code";
    msg.style.color = "red";
    return;
  }

  try {
    // 1. POST request to verify the code against the email
    const response = await fetch("http://localhost:8080/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email, otp: otpCode })
    });

    if (response.ok) {
      // ✅ SUCCESS: Establish the local session
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("loggedInEmail", email);
      
      // Clean up the temporary email storage
      localStorage.removeItem("tempEmail");

      // ✅ REDIRECT: Move up one level to the dashboard
      window.location.replace("../dashboard.html");
    } else {
      const errorData = await response.json();
      msg.innerText = errorData.message || "Invalid OTP. Please try again.";
      msg.style.color = "red";
    }
  } catch (error) {
    console.error("Connection Error:", error);
    msg.innerText = "Error connecting to verification server.";
    msg.style.color = "red";
  }
}