require("dotenv").config();
const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth");

const app = express();

app.use(cors());
app.use(express.json());

// All auth-related routes: /send-otp and /verify-otp
app.use("/", authRoutes);

app.get("/", (req, res) => {
  res.send("Email OTP Authentication backend is running.");
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
