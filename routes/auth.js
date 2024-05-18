const express = require("express");
const User = require("../models/User");

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { name, username, email, password } = req.body;
    let existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      res.json({ message: "User exists with this username or email", user });
    }
    const user = new User({
      name,
      username,
      email,
      password,
    });
    const savedUser = await user.save();
    res.json({ message: "User registered successfully!", savedUser });
  } catch (err) {
    res.status(400).json({ error: "Internal server error", err });
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
