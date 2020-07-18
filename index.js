require("dotenv").config();
const express = require("express");
const app = express();
const server = require("http").Server(app);
const passport = require("passport");
const twitchStrategy = require("passport-twitch.js").Strategy;
const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");
const mongoose = require("mongoose");
const { body, validationResult } = require("express-validator");

// Models
const User = require("./models/users");
const DailyLog = require("./models/dailyLogs");

app.set("trust proxy", 1);
app.set("views", "./views");
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(
  cookieSession({
    name: "session",
    secret: `${process.env.SESSION_SECRET}`,
    saveUninitialized: false,
    resave: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());

mongoose
  .connect(
    `mongodb+srv://chilltrack:${process.env.DB_PASS}@cluster0-h53nv.gcp.mongodb.net/chilltrack?retryWrites=true&w=majority`,
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
    }
  )
  .catch(function (err) {
    // TODO: Throw error page if DB doesn't connect
    console.error("Unable to connect to the mongodb instance. Error: ", err);
  });

function loggedIn(req, res, next) {
  if (!req.user) {
    res.redirect("/login");
  } else {
    next();
  }
}

//Routes
app.get("/", async (req, res) => {
  res.render("feed", {
    loggedInUser: req.user.login,
    dailyLogs: dailyLogs,
  });
});

app.get("/auth/twitch", passport.authenticate("twitch.js"));
app.get(
  "/auth/twitch/callback",
  passport.authenticate("twitch.js", { failureRedirect: "/" }),
  function (req, res) {
    // Successful authentication.
    res.redirect("/feed");
  }
);

app.get("/feed", async (req, res) => {
  let dailyLogs = await DailyLog.find().limit(10);
  let user = req.user || false;
  res.render("feed", {
    loggedInUser: user,
    dailyLogs: dailyLogs,
  });
});

app.get("/your-page", loggedIn, async (req, res) => {
  let dailyLogs = await DailyLog.find({ user: req.user.login });
  console.log(dailyLogs);
  res.render("your-page", {
    loggedInUser: req.user.login,
    logs: dailyLogs,
  });
});

app.get("/new/:day", loggedIn, (req, res) => {
  res.render("new", {
    loggedInUser: req.user.login,
    day: req.params.day,
  });
});

app.post(
  "/newlog",
  loggedIn,
  [
    body("logtext").isString().not().isEmpty().trim().escape(),
    body("proof")
      .isURL({ protocols: ["https"], require_protocol: true })
      .trim(),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    let newLog = new DailyLog({
      user: req.user.login,
      day: req.query.day,
      text: req.body.logtext,
      proof: req.body.proof,
    });
    newLog.save((err) => {
      if (err) {
        console.error(err);
        res.status(500).send("Error creating new log");
      }

      console.log("New log");
      res.redirect("/your-page?success=true");
    });
  }
);

// Public User page
app.get("/user/:user/", async (req, res) => {
  let loggedInUser = req.user || false;
  let publicUser = req.params.user;
  res.render("publicUser", {
    loggedInUser: loggedInUser,
    publicUser: publicUser,
  });
});

// Specific Day
app.get("/log/:user/:day", loggedIn, async (req, res) => {
  let dailyLog = await DailyLog.findOne({
    user: req.params.user,
    day: req.params.day,
  });
  let logOwner;
  if (req.user.login === req.params.user) {
    logOwner = true;
  } else {
    logOwner = false;
  }
  res.render("log", {
    loggedInUser: req.user.login,
    loggedInUserPic: req.user.profile_pic_url,
    dailyLog: dailyLog,
    logOwner: logOwner,
  });
});

app.get("/api/logs", loggedIn, async (req, res) => {
  let dailyLogs = await DailyLog.find({ user: req.user.login });
  res.status(200).send(dailyLogs);
});

app.get("/api/logs/:user", async (req, res) => {
  let dailyLogs = await DailyLog.find({ user: req.params.user });
  res.status(200).send(dailyLogs);
});

app.get("/logout", async function (req, res) {
  try {
    req.session = null;
    req.user = null;
    req.logout();
    res.render("bye", {
      loggedInUser: false,
    });
  } catch (err) {
    console.error(err);
  }
});

app.get("/login", async function (req, res) {
  res.render("login", {
    loggedInUser: false,
  });
});

passport.use(
  new twitchStrategy(
    {
      clientID: process.env.TWITCH_CLIENTID,
      clientSecret: process.env.TWITCH_SECRET,
      callbackURL: `${process.env.APP_URL}/auth/twitch/callback`,
      scope: "",
    },
    async function (accessToken, refreshToken, profile, done) {
      try {
        User.findOne({ twitch_id: profile.id })
          .exec()
          .then(function (UserSearch) {
            if (UserSearch === null) {
              var user = new User({
                twitch_id: profile.id,
                username: profile.login,
                display_name: profile.display_name,
                email: profile.email,
                profile_pic_url: profile.profile_image_url,
                provider: "twitch",
                twitch: profile,
                accessToken: accessToken,
                refreshToken: refreshToken,
              });
              console.log("New user created");

              user.save();
              return done(null, profile);
            } else {
              console.log("User already exists");
              console.log(UserSearch.twitch_id);
              return done(null, profile);
            }
          })
          .catch((err) => {
            console.error(err);
          });
      } catch (err) {
        console.error(err);
      }
    }
  )
);

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (obj, done) {
  done(null, obj);
});

const port = process.env.PORT || 3000;
server.listen(port);
