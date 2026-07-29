const bcrypt = require("bcryptjs");
const prisma = require("../prismaClient");
const { sendOtpEmail } = require("../mailer");

const OTP_EXPIRY_MINUTES = 5;
const SALT_ROUNDS = 10;
const MIN_PASSWORD_LENGTH = 6;

// Basic email format validation
function isValidEmail(email) {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Generates a random 6-digit OTP as a string, e.g. "042193"
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// POST /signup
// Body: { email, username, dob, password, confirmPassword }
async function signUp(req, res) {
  try {
    const { email, username, dob, password, confirmPassword } = req.body;

    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, message: "Please enter a valid email address." });
    }

    if (!username || !username.trim()) {
      return res.status(400).json({ success: false, message: "Username is required." });
    }

    if (!dob) {
      return res.status(400).json({ success: false, message: "Date of birth is required." });
    }

    const dobDate = new Date(dob);
    if (isNaN(dobDate.getTime())) {
      return res.status(400).json({ success: false, message: "Please enter a valid date of birth." });
    }
    if (dobDate > new Date()) {
      return res.status(400).json({ success: false, message: "Date of birth cannot be in the future." });
    }

    if (!password || password.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: "Passwords do not match." });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ success: false, message: "Email is already registered. Please log in instead." });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    await prisma.user.create({
      data: {
        email,
        username: username.trim(),
        dob: dobDate,
        password: hashedPassword,
      },
    });

    return res.json({ success: true, message: "Successfully signed up." });
  } catch (error) {
    console.error("Error in signUp:", error);
    return res.status(500).json({ success: false, message: "Something went wrong. Please try again." });
  }
}

// POST /send-otp
// Body: { email, password }
async function sendOtp(req, res) {
  try {
    const { email, password } = req.body;

    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, message: "Please enter a valid email address." });
    }

    if (!password) {
      return res.status(400).json({ success: false, message: "Password is required." });
    }

    // Check whether the email is registered
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(404).json({ success: false, message: "Email not registered." });
    }

    // Verify the password before issuing an OTP
    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      return res.status(401).json({ success: false, message: "Incorrect password." });
    }

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    // Store the OTP + expiry in the database, linked to the user
    await prisma.otp.create({
      data: {
        otp,
        expiresAt,
        userId: user.id,
      },
    });

    // Send the OTP via email
    await sendOtpEmail(email, otp);

    return res.json({ success: true, message: "OTP sent to your email." });
  } catch (error) {
    console.error("Error in sendOtp:", error);
    return res.status(500).json({ success: false, message: "Something went wrong. Please try again." });
  }
}

// POST /verify-otp
// Body: { email, otp }
async function verifyOtp(req, res) {
  try {
    const { email, otp } = req.body;

    if (!isValidEmail(email) || !otp) {
      return res.status(400).json({ success: false, message: "Email and OTP are required." });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(404).json({ success: false, message: "Email not registered." });
    }

    // Get the most recent OTP requested for this user
    const latestOtp = await prisma.otp.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    if (!latestOtp) {
      return res.status(400).json({ success: false, message: "No OTP found. Please request a new one." });
    }

    if (latestOtp.verified) {
      return res.status(400).json({ success: false, message: "This OTP has already been used. Please request a new one." });
    }

    if (new Date() > latestOtp.expiresAt) {
      return res.status(400).json({ success: false, message: "OTP expired. Please request a new one." });
    }

    if (latestOtp.otp !== otp) {
      return res.status(400).json({ success: false, message: "Invalid OTP." });
    }

    // Mark OTP as used (one-time use only)
    await prisma.otp.update({
      where: { id: latestOtp.id },
      data: { verified: true },
    });

    return res.json({ success: true, message: "Successfully logged in." });
  } catch (error) {
    console.error("Error in verifyOtp:", error);
    return res.status(500).json({ success: false, message: "Something went wrong. Please try again." });
  }
}

module.exports = { signUp, sendOtp, verifyOtp };
