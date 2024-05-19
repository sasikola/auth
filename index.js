const express = require("express");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const passport = require("./middleware/auth");

const db = require("./db");
const User = require("./models/User");
const router = require("./routes/authRoute");

dotenv.config();
const port = process.env.PORT;

const app = express();
app.use(passport.initialize());

app.use(bodyParser.urlencoded({ extended: false }));

app.use(bodyParser.json());
const localAuthMiddleware = passport.authenticate("local", { session: false });

app.get("/", (req, res) => {
  res.send("Server is healthy!");
});

// Routes

app.use("/auth", router);

app.listen(port, () => {
  console.log(`Server listening on port ${port}!`);
});
