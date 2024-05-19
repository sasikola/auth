const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const User = require("../models/User");

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

module.exports = passport;
