// Base URL of the backend API.
const API_BASE_URL = "http://localhost:4000";

const emailInput = document.getElementById("signup-email");
const usernameInput = document.getElementById("signup-username");
const dobInput = document.getElementById("signup-dob");
const passwordInput = document.getElementById("signup-password");
const confirmPasswordInput = document.getElementById("signup-confirm-password");
const signupBtn = document.getElementById("signup-btn");
const messageEl = document.getElementById("message");

// Password Toggle Icons
const togglePassword = document.getElementById("togglePassword");
const toggleConfirmPassword = document.getElementById("toggleConfirmPassword");

function showMessage(text, type) {
  messageEl.textContent = text;
  messageEl.className = "message " + (type || "");
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ---------------- PASSWORD TOGGLE ----------------

function toggleVisibility(input, icon) {

  if (input.type === "password") {

    input.type = "text";

    icon.classList.remove("fa-eye");
    icon.classList.add("fa-eye-slash");

  } else {

    input.type = "password";

    icon.classList.remove("fa-eye-slash");
    icon.classList.add("fa-eye");
  }
}

togglePassword.addEventListener("click", () => {
  toggleVisibility(passwordInput, togglePassword);
});

toggleConfirmPassword.addEventListener("click", () => {
  toggleVisibility(confirmPasswordInput, toggleConfirmPassword);
});

// ---------------- SIGNUP ----------------

signupBtn.addEventListener("click", async () => {

  const email = emailInput.value.trim();
  const username = usernameInput.value.trim();
  const dob = dobInput.value;
  const password = passwordInput.value;
  const confirmPassword = confirmPasswordInput.value;

  if (!isValidEmail(email)) {
    showMessage("Please enter a valid email address.", "error");
    return;
  }

  if (!username) {
    showMessage("Please enter a username.", "error");
    return;
  }

  if (!dob) {
    showMessage("Please enter your date of birth.", "error");
    return;
  }

  if (!password || password.length < 6) {
    showMessage("Password must be at least 6 characters.", "error");
    return;
  }

  if (password !== confirmPassword) {
    showMessage("Passwords do not match.", "error");
    return;
  }

  signupBtn.disabled = true;
  signupBtn.textContent = "Signing up...";

  try {

    const response = await fetch(`${API_BASE_URL}/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email,
        username,
        dob,
        password,
        confirmPassword
      })
    });

    const data = await response.json();

    if (data.success) {

      showMessage(
        "Signup successful! Redirecting to Login...",
        "success"
      );

      signupBtn.textContent = "Success ✓";

      setTimeout(() => {

        window.location.href = "login.html";

      }, 1500);

    } else {

      showMessage(data.message, "error");

      signupBtn.disabled = false;
      signupBtn.textContent = "Sign Up";
    }

  } catch (err) {

    showMessage(
      "Could not reach the server. Please try again.",
      "error"
    );

    signupBtn.disabled = false;
    signupBtn.textContent = "Sign Up";
  }

});