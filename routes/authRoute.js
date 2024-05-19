const express = require("express");
const User = require("../models/User");
const bcrypt = require("bcrypt");

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { name, username, email, password } = req.body;
    let existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      res.json({ message: "User exists with this username or email", user });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({
      name,
      username,
      email,
      password: hashedPassword,
    });
    const savedUser = await user.save();
    res.json({ message: "User registered successfully!", savedUser });
  } catch (err) {
    res.status(400).json({ error: "Internal server error", err });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username })
    if (!user) {
      return res.status(400).json({ message: "User not found!" });
    }
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(400).json({ message: "Incorrect password!" });
    } else {
      return res.status(200).json({ message: "Logged in successfully!"});
    }
  } catch (error) {
    res.status(400).json({ error: "Internal server error", error });
  }
});

router.get("/users", async (req, res) => {
  try {
    const users = await User.find();
    res.json({ message: "Users fetched successfully!", users });
  } catch (err) {
    res.status(400).json({ error: "Internal server error", err });
  }
});

module.exports = router;
