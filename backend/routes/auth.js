const express = require("express");
const router = express.Router();
const { signUp, sendOtp, verifyOtp } = require("../controllers/authController");

router.post("/signup", signUp);
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);

module.exports = router;
