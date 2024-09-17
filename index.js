const express = require("express");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const passport = require("./middleware/passportAuth");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const db = require("./db");
const User = require("./models/User");
const authRouter = require("./routes/authRoute");
const productRouter = require("./routes/productRoute");

dotenv.config();
const port = process.env.PORT;

const app = express();
app.use(passport.initialize());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(bodyParser.json());
const localAuthMiddleware = passport.authenticate("local", { session: false });

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

app.listen(port, () => {
  console.log(`Server listening on port ${port}!`);
});
