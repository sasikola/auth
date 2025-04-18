const express = require("express");
const { createServer } = require("node:http");
const { join } = require("node:path");
const { Server } = require("socket.io");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const db = require("./db");
const User = require("./models/User");
const authRouter = require("./routes/authRoute");
const productRouter = require("./routes/productRoute");

dotenv.config();
const port = process.env.PORT || 5000;

const app = express();
const server = createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: "*", // Replace with actual origin in production
    methods: ["GET", "POST"],
  },
});

// In-memory room tracking
const rooms = {};

// Socket.IO events
io.on("connection", (socket) => {
  console.log("🔗 User connected:", socket.id);

  socket.on("join", (roomId) => {
    if (!rooms[roomId]) {
      rooms[roomId] = [];
    }

    rooms[roomId].push(socket.id);
    socket.join(roomId);

    const clients = rooms[roomId];
    console.log(`🏠 Room ${roomId} has ${clients.length} client(s)`);

    if (clients.length === 1) {
      socket.emit("created");
    } else if (clients.length === 2) {
      socket.emit("joined");
      socket.to(roomId).emit("ready");
    } else {
      socket.emit("full");
    }
  });

  socket.on("offer", ({ offer, roomId }) => {
    socket.to(roomId).emit("offer", { offer });
  });

  socket.on("answer", ({ answer, roomId }) => {
    socket.to(roomId).emit("answer", { answer });
  });

  socket.on("ice-candidate", ({ candidate, roomId }) => {
    socket.to(roomId).emit("ice-candidate", { candidate });
  });

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
    for (const roomId in rooms) {
      rooms[roomId] = rooms[roomId].filter((id) => id !== socket.id);
      if (rooms[roomId].length === 0) {
        delete rooms[roomId];
      }
    }
  });
});

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors({ origin: "*", methods: ["GET", "POST", "PUT", "DELETE"], credentials: true }));
app.use(bodyParser.json());

// Health check route
app.get("/", (req, res) => {
  res.send("Server is healthy!");
});

// Ensure uploads directory exists
const productsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(productsDir)) {
  fs.mkdirSync(productsDir);
}

// Static file serving
app.use("/uploads", express.static(productsDir));

// Routes
app.use("/auth", authRouter);
app.use("/user", productRouter);

// Start server
server.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
