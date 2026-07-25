const prisma = require("../prismaClient");
const { sendOtpEmail } = require("../mailer");

const OTP_EXPIRY_MINUTES = 5;

// Basic email format validation
function isValidEmail(email) {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Generates a random 6-digit OTP as a string, e.g. "042193"
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// POST /send-otp
// Body: { email }
async function sendOtp(req, res) {
  try {
    const { email } = req.body;

    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, message: "Please enter a valid email address." });
    }

    // Check whether the email is registered
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(404).json({ success: false, message: "Email not registered." });
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

    return res.json({ success: true, message: "Login successful." });
  } catch (error) {
    console.error("Error in verifyOtp:", error);
    return res.status(500).json({ success: false, message: "Something went wrong. Please try again." });
  }
}

module.exports = { sendOtp, verifyOtp };
