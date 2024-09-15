const express = require("express");
const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { jwtAuthMiddleware, generateToken } = require("../middleware/jwtAuth");
const nodemail = require("nodemailer");

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { fullName, userName, email, mobile, password } = req.body;
    let existingUser = await User.findOne({ $or: [{ userName }, { email }] });
    if (existingUser) {
      res.json({ error: "User exists with this username or email" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({
      fullName,
      userName,
      email,
      mobile,
      password: hashedPassword,
    });
    const response = await user.save();
    const payload = {
      _id: response.id,
      username: response.userName,
    };
    const token = generateToken(payload);
    res.json({
      message: "User registered successfully!",
      response: response,
      token: token,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { userName, password } = req.body;
    const user = await User.findOne({ userName });
    if (!user) {
      return res
        .status(400)
        .json({ error: "User not found with this username!" });
    }
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(400).json({ error: "Incorrect password!" });
    }

    // to generate token
    const payload = {
      _id: user.id,
      userName: user.userName,
    };
    const token = generateToken(payload);

    res.status(200).json({ message: "Logged in successfully!", token: token });
  } catch (error) {
    res.status(500).json({ error: "Internal server error", error });
  }
});

// route to get all users
router.get("/users", jwtAuthMiddleware, async (req, res) => {
  try {
    const users = await User.find();
    res.json({ message: "Users fetched successfully!", users });
  } catch (err) {
    res.status(500).json({ error: "Internal server error", err });
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

// route to forgot password
router.post("/forgot-password", async (req, res) => {
  try {
    const { email, mobile, newPassword, confirmNewPassword } = req.body;

    const user = await User.findOne({ email, mobile });
    if (!user) {
      return res.status(400).json({ error: "Invalid email or mobile number!" });
    }

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ error: "Passwords do not match!" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Password reset successfully!" });
  } catch (error) {
    res.status(500).json({ error: "Internal server error", error });
  }
});

module.exports = router;
