const express = require("express");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const db = require("./db");
const User = require("./models/User");
const authRouter = require("./routes/authRoute");
const productRouter = require("./routes/productRoute");

dotenv.config();
const port = process.env.PORT || 5000;

const app = express();
const server = http.createServer(app); // Create HTTP server
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);
app.use(bodyParser.json());

// Routes
app.get("/", (req, res) => {
  res.send("Server is healthy!");
});

const productsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(productsDir)) {
  fs.mkdirSync(productsDir);
}
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/auth", authRouter);
app.use("/user", productRouter);

// 🌐 Socket.IO logic
const users = {};

io.on("connection", (socket) => {
  console.log("✅ Client connected:", socket.id);

  // When a user joins
  socket.on("join", (username) => {
    users[socket.id] = username;
    console.log(`👤 ${username} joined as ${socket.id}`);
    io.emit("users", users);
  });

  // When a message is sent
  socket.on("message", (data) => {
    console.log("💬 Message:", data);
    io.emit("message", data);
  });

  // When calling another user
  socket.on("call-user", ({ signal, to, username }) => {
    console.log(`📞 ${socket.id} is calling ${to}`);
    io.to(to).emit("incoming-call", {
      from: socket.id,
      signal,
      username,
    });
  });

  // When answering a call
  socket.on("answer-call", ({ signal, to, username }) => {
    console.log(`✅ Call answered by ${socket.id} to ${to}`);
    io.to(to).emit("call-answered", {
      signal,
      username,
    });
  });

  // When disconnecting
  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
    delete users[socket.id];
    io.emit("users", users);
  });
});

// Start the HTTP server
server.listen(port, () => {
  console.log(`🚀 Server listening on port ${port}`);
});
