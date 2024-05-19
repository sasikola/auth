const express = require("express");
const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { jwtAuthMiddleware, generateToken } = require("../middleware/jwtAuth");

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { name, username, email, password } = req.body;
    let existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      res.json({ error: "User exists with this username or email" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({
      name,
      username,
      email,
      password: hashedPassword,
    });
    const response = await user.save();
    const payload = {
      _id: response.id,
      username: response.username,
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
    const { username, password } = req.body;
    const user = await User.findOne({ username });
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
      username: user.username,
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

module.exports = router;
