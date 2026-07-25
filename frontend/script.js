// Base URL of the backend API. Change this if your backend runs elsewhere.
const API_BASE_URL = "http://localhost:4000";

const emailStep = document.getElementById("email-step");
const otpStep = document.getElementById("otp-step");
const emailInput = document.getElementById("email");
const otpInput = document.getElementById("otp");
const sendOtpBtn = document.getElementById("send-otp-btn");
const verifyOtpBtn = document.getElementById("verify-otp-btn");
const messageEl = document.getElementById("message");

function showMessage(text, type) {
  messageEl.textContent = text;
  messageEl.className = "message " + (type || "");
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

sendOtpBtn.addEventListener("click", async () => {
  const email = emailInput.value.trim();

  if (!isValidEmail(email)) {
    showMessage("Please enter a valid email address.", "error");
    return;
  }

  sendOtpBtn.disabled = true;
  sendOtpBtn.textContent = "Sending...";

  try {
    const response = await fetch(`${API_BASE_URL}/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (data.success) {
      showMessage(data.message, "success");
      otpStep.classList.remove("hidden");
    } else {
      showMessage(data.message, "error");
    }
  } catch (err) {
    showMessage("Could not reach the server. Please try again.", "error");
  } finally {
    sendOtpBtn.disabled = false;
    sendOtpBtn.textContent = "Send OTP";
  }
});

verifyOtpBtn.addEventListener("click", async () => {
  const email = emailInput.value.trim();
  const otp = otpInput.value.trim();

  if (!otp) {
    showMessage("Please enter the OTP.", "error");
    return;
  }

  verifyOtpBtn.disabled = true;
  verifyOtpBtn.textContent = "Verifying...";

  try {
    const response = await fetch(`${API_BASE_URL}/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp }),
    });

    const data = await response.json();

    if (data.success) {
      sessionStorage.setItem("loggedIn", "true");
      sessionStorage.setItem("userEmail", email);
      window.location.href = "welcome.html";
    } else {
      showMessage(data.message, "error");
    }
  } catch (err) {
    showMessage("Could not reach the server. Please try again.", "error");
  } finally {
    verifyOtpBtn.disabled = false;
    verifyOtpBtn.textContent = "Verify OTP";
  }
});
