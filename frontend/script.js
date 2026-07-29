// Base URL of the backend API. Change this if your backend runs elsewhere.
const API_BASE_URL = "http://localhost:4000";

// ---------- Step elements ----------
const robotCheckStep = document.getElementById("robot-check-step");
const notRobotCheckbox = document.getElementById("not-robot-checkbox");

const emailStep = document.getElementById("email-step");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const sendOtpBtn = document.getElementById("send-otp-btn");

const otpStep = document.getElementById("otp-step");
const otpInput = document.getElementById("otp");
const verifyOtpBtn = document.getElementById("verify-otp-btn");

const messageEl = document.getElementById("message");

function showMessage(text, type) {
  messageEl.textContent = text;
  messageEl.className = "message " + (type || "");
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ---------- Step 0: Bot check ----------
// Checking the box simply reveals the email + CAPTCHA form.
// Unchecking it hides the form again and resets the CAPTCHA.
notRobotCheckbox.addEventListener("change", () => {
  if (notRobotCheckbox.checked) {
    emailStep.classList.remove("hidden");
    showMessage("", "");
  } else {
    emailStep.classList.add("hidden");
    otpStep.classList.add("hidden");
    refreshCaptcha();
  }
});

// ---------- CAPTCHA ----------
const captchaCanvas = document.getElementById("captcha-canvas");
const captchaCtx = captchaCanvas.getContext("2d");
const captchaInput = document.getElementById("captcha-input");
const refreshCaptchaBtn = document.getElementById("refresh-captcha-btn");

const CAPTCHA_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I to avoid confusion
let currentCaptcha = "";

function generateCaptchaText(length = 6) {
  let text = "";
  for (let i = 0; i < length; i++) {
    text += CAPTCHA_CHARS.charAt(Math.floor(Math.random() * CAPTCHA_CHARS.length));
  }
  return text;
}

function drawCaptcha(text) {
  const { width, height } = captchaCanvas;
  captchaCtx.clearRect(0, 0, width, height);

  // Background
  captchaCtx.fillStyle = "#f3f4f6";
  captchaCtx.fillRect(0, 0, width, height);

  // Noise lines (for basic visual obfuscation)
  for (let i = 0; i < 5; i++) {
    captchaCtx.strokeStyle = `rgba(37, 99, 235, ${Math.random() * 0.3 + 0.1})`;
    captchaCtx.beginPath();
    captchaCtx.moveTo(Math.random() * width, Math.random() * height);
    captchaCtx.lineTo(Math.random() * width, Math.random() * height);
    captchaCtx.stroke();
  }

  // Draw each character with slight random rotation/offset
  const charSpacing = width / (text.length + 1);
  for (let i = 0; i < text.length; i++) {
    const x = charSpacing * (i + 1);
    const y = height / 2 + (Math.random() * 10 - 5);
    const angle = (Math.random() * 30 - 15) * (Math.PI / 180);

    captchaCtx.save();
    captchaCtx.translate(x, y);
    captchaCtx.rotate(angle);
    captchaCtx.font = "bold 24px Arial";
    captchaCtx.fillStyle = "#1f2937";
    captchaCtx.textAlign = "center";
    captchaCtx.textBaseline = "middle";
    captchaCtx.fillText(text[i], 0, 0);
    captchaCtx.restore();
  }
}

function refreshCaptcha() {
  currentCaptcha = generateCaptchaText();
  drawCaptcha(currentCaptcha);
  captchaInput.value = "";
}

refreshCaptchaBtn.addEventListener("click", () => {
  refreshCaptcha();
  showMessage("New code generated.", "");
});

// Draw the first CAPTCHA as soon as the page loads (form is hidden until the checkbox is checked)
refreshCaptcha();

// ---------- Step 1: Email + CAPTCHA -> Send OTP ----------
sendOtpBtn.addEventListener("click", async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  const enteredCaptcha = captchaInput.value.trim().toUpperCase();

  if (!isValidEmail(email)) {
    showMessage("Please enter a valid email address.", "error");
    return;
  }

  if (!password) {
    showMessage("Please enter your password.", "error");
    return;
  }

  if (enteredCaptcha !== currentCaptcha) {
    showMessage("Incorrect security code. Please try again.", "error");
    refreshCaptcha();
    return;
  }

  sendOtpBtn.disabled = true;
  sendOtpBtn.textContent = "Sending...";

  try {
    const response = await fetch(`${API_BASE_URL}/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (data.success) {
      showMessage(data.message, "success");
      otpStep.classList.remove("hidden");
    } else {
      showMessage(data.message, "error");
      refreshCaptcha();
    }
  } catch (err) {
    showMessage("Could not reach the server. Please try again.", "error");
    refreshCaptcha();
  } finally {
    sendOtpBtn.disabled = false;
    sendOtpBtn.textContent = "Send OTP";
  }
});

// ---------- Step 2: Verify OTP ----------
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
      sessionStorage.setItem("authMessage", data.message); // "Successfully logged in."
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

