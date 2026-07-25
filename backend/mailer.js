// Handles sending the OTP email via Gmail SMTP (or Mailtrap) using Nodemailer
const nodemailer = require("nodemailer");

// Gmail SMTP transporter.
// If you want to use Mailtrap for testing instead, replace this config with:
// { host: "sandbox.smtp.mailtrap.io", port: 2525, auth: { user: ..., pass: ... } }
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendOtpEmail(toEmail, otp) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: toEmail,
    subject: "Your OTP Code",
    text: `Your OTP code is ${otp}. It will expire in 5 minutes.`,
    html: `<p>Your OTP code is <b>${otp}</b>.</p><p>It will expire in 5 minutes.</p>`,
  };

  await transporter.sendMail(mailOptions);
}

module.exports = { sendOtpEmail };
