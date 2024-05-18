const express = require("express");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;

const db = require("./db");
const User = require("./models/User");
const router = require("./routes/auth");

dotenv.config();
const port = process.env.PORT;

const app = express();
app.use(passport.initialize());

passport.use(
  new LocalStrategy(async (username, password, done) => {
    // authentication logic here
    try {
      console.log("Received credentials", username, password);
      const user = await User.findOne({ username: username });
      if (!user) {
        return done(null, false, {
          message: "User not found with these credentials!",
        });
      }
      const isPasswordMatch = user.password === password ? true : false;

      if (!isPasswordMatch) {
        return done(null, false, {
          message: "Incorrect password!",
        });
      } else {
        return done(null, user, {
          message: "Logged in successfully!",
        });
      }
    } catch (error) {
      return done(error);
    }
  })
);

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
