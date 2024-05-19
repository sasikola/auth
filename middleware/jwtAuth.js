const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();

const jwtAuthMiddleware = async (req, res, next) => {
  try {
    const token = req.header("Authorization").split(" ")[1];
    // const token = req.header.authorization.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Token not found!" });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: "Not authorized, token failed" });
  }
};

// function to generate token
const generateToken = (userData) => {
  // generate a new jwt token using user data
  return jwt.sign(userData, process.env.JWT_SECRET, { expiresIn: 30000 });
};

module.exports = { jwtAuthMiddleware, generateToken };
