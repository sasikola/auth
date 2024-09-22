const express = require("express");
const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { jwtAuthMiddleware, generateToken } = require("../middleware/jwtAuth");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { fullName, userName, email, mobile, password, confirmPassword } = req.body;

    // Check if all fields are provided
    if (!fullName || !userName || !email || !mobile || !password || !confirmPassword) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match" });
    }

    // Check if the user already exists by username or email
    let existingUser = await User.findOne({ $or: [{ userName }, { email }] });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists with this username or email" });
    }

    // Hash the password before saving
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create a new user with the hashed password
    const user = new User({
      fullName,
      userName,
      email,
      mobile,
      password: hashedPassword, // Storing the hashed password
    });

    // Save the user to the database
    const savedUser = await user.save();

    // Send success response
    res.status(201).json({
      message: "User registered successfully!",
      user: savedUser,
    });

  } catch (err) {
    console.error("Error during registration:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});
// this is for login route
router.post("/login", async (req, res) => {
  try {
    const { userName, password } = req.body;

    // Input validation: Ensure userName and password are provided
    if (!userName || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    // Fetch user by userName
    const user = await User.findOne({ userName });
    if (!user) {
      return res.status(400).json({ error: "User not found with this username!" });
    }

    // Compare the plain password with the hashed password
    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch) {
      return res.status(400).json({ error: "Incorrect password!" });
    }

    // Generate a token (JWT or any other token generator you use)
    const payload = {
      _id: user._id,
      userName: user.userName,
    };
    const token = generateToken(payload);

    // Respond with success message and token
    res.status(200).json({
      message: "Logged in successfully!",
      token: token,
      user: {
        _id: user._id,
        userName: user.userName,
        email: user.email, // Include other necessary user details
      }
    });

  } catch (error) {
    console.error("Error during login:", error);  // Log the error for debugging
    res.status(500).json({ error: "Internal server error" });
  }
});


// route to ger profile data
router.get("/profile", jwtAuthMiddleware, async (req, res) => {
  try {
    const userData = req.user;
    console.log("User data is :", userData);

    const userId = userData._id;
    const user = await User.findById(userId);
    res
      .status(200)
      .json({ message: "User profile fetched successfully!", user: user });
  } catch (error) {
    res.status(500).json({ error: "Internal server error", error });
  }
});

// Helper function to generate a 6-digit OTP
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "User not found with this email!" });
    }

    // Generate OTP and set expiration (1 hour)
    const otp = generateOTP();
    const otpExpire = Date.now() + 3600000; // 1 hour expiration

    // Store OTP and expiration in the user's record (ensure fields exist in the model)
    user.resetPasswordOtp = otp;
    user.resetPasswordOtpExpire = otpExpire;
    await user.save();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER || "sasikola5@gmail.com",
        pass: process.env.EMAIL_PASS || "xvfr tpln ihtg llgm",
      },
    });

    // Email options
    const mailOptions = {
      from: "sasikola5@gmail.com", // Sender email
      to: user.email, // Receiver email (user's email)
      subject: "Password Reset OTP",
      text: `Your OTP for password reset is: ${otp}. It is valid for 1 hour.`,
    };

    // Send the email
    await transporter.sendMail(mailOptions);

    // Response
    res.status(200).json({ message: "OTP sent to email!" });
  } catch (err) {
    console.log("Error: ", err); // Log the error for debugging
    res.status(500).json({ error: "Internal server error", err });
  }
});

// Function to generate OTP (if not defined)
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000); // Generate 6-digit OTP
}

// Step 3: Verify OTP
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body; // Extract email and otp from req.body

    if (!email || !otp) {
      return res.status(400).json({ error: "Email and OTP are required!" });
    }

    const user = await User.findOne({
      email, // Use the extracted email here
      resetPasswordOtp: otp,
      resetPasswordOtpExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired OTP!" });
    }

    res
      .status(200)
      .json({ message: "OTP verified, proceed to reset password" });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Step 4: Reset password after OTP verification
router.post("/reset-password", async (req, res) => {
  try {
    const { email, newPassword, confirmNewPassword } = req.body;

    // Check if new password and confirm password match
    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ error: "Passwords do not match!" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "User not found!" });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update the user's password and clear OTP-related fields
    user.password = hashedPassword;
    user.resetPasswordOtp = undefined;
    user.resetPasswordOtpExpire = undefined;

    await user.save();

    res.status(200).json({ message: "Password reset successful!" });
  } catch (error) {
    res.status(500).json({ error: "Internal server error", error });
  }
});

module.exports = router;
