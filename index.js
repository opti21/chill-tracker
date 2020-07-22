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

// Discord bot
const Discord = require("discord.js");
const discordClient = new Discord.Client();

discordClient.on("ready", () => {
  console.log(`Logged in as ${discordClient.user.tag}!`);
});

discordClient.on("message", (msg) => {
  if (msg.content === "ping") {
    msg.reply("pong");
  }
});

discordClient.login(process.env.DISCORD_TOKEN);

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
  let loggedInUser = req.user || false;
  let dailyLogs = await DailyLog.find().limit(10).sort({ createdAt: -1 });
  res.render("feed", {
    loggedInUser: loggedInUser,
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
  let user = req.user || false;
  res.render("feed", {
    loggedInUser: user,
  });
});

app.get("/your-page", loggedIn, async (req, res) => {
  let dailyLogs = await DailyLog.find({ user: req.user.login });
  let user = await User.findOne({ username: req.user.login }, "task -_id");
  let hasTask;
  if (user.task === undefined) {
    hasTask = false;
  } else {
    hasTask = true;
  }
  // console.log(dailyLogs);
  res.render("your-page", {
    loggedInUser: req.user.login,
    logs: dailyLogs,
    hasTask: hasTask,
    task: user.task,
  });
});

app.get("/new/:day", loggedIn, (req, res) => {
  res.render("new", {
    loggedInUser: req.user.login,
    day: req.params.day,
  });
});

app.get("/stats", async (req, res) => {
  let loggedInUser = req.user || false;
  let userCount = await User.estimatedDocumentCount();
  let logCount = await DailyLog.estimatedDocumentCount();
  res.render("stats", {
    loggedInUser: loggedInUser,
    userCount: userCount,
    logCount: logCount,
  });
});

app.post(
  "/newlog",
  loggedIn,
  [
    body("logtext").isString().not().isEmpty().trim(),
    body("proof").isString().trim(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    let exists = DailyLog.exists({ user: req.user.login, day: req.query.day });
    let user = await User.findOne(
      { username: req.user.login },
      "task profile_pic_url -_id"
    );

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
      try {
        let discordChannel = discordClient.channels.cache.find(
          (ch) => ch.name === "30-day-challenge"
        );
        console.log(discordChannel);
        if (!discordChannel) {
          return res.redirect("/your-page?success=true");
        } else {
          let logEmbed;
          let exclamations = ["Great job", "Way to go", "Sweet as"];
          let exclamation =
            exclamations[Math.floor(Math.random() * exclamations.length)];

          if (
            req.body.proof.includes("jpg") ||
            req.body.proof.includes("jpeg") ||
            req.body.proof.includes("png") ||
            req.body.proof.includes("gif")
          ) {
            // if URL does have image tag
            logEmbed = {
              content: `${req.user.login} added their day ${req.query.day} log. ${exclamation} ${req.user.login}!`,
              embed: {
                title: `Day ${req.query.day} of ${user.task}`,
                description: `**Log:**\n${req.body.logtext}`,
                url: `${process.env.APP_URL}/log/${req.user.login}/${req.query.day}`,
                color: 1168657,
                author: {
                  name: req.user.login,
                  icon_url: user.profile_pic_url,
                },
                fields: [
                  {
                    name: "Proof:",
                    value: `${req.body.proof}\n`,
                  },
                ],
                image: {
                  url: req.body.proof,
                },
              },
            };
          } else {
            // if URL doesn't have image tag
            logEmbed = {
              embed: {
                title: `Day ${req.query.day} of ${user.task}`,
                description: `**Log:**\n${req.body.logtext}`,
                url: `${process.env.APP_URL}/log/${req.user.login}/${req.query.day}`,
                color: 1168657,
                author: {
                  name: req.user.login,
                  icon_url: user.profile_pic_url,
                },
                fields: [
                  {
                    name: "Proof:",
                    value: `${req.body.proof}\n`,
                  },
                ],
              },
            };
          }

          discordChannel.send(logEmbed);
        }
      } catch (err) {
        console.error(err);
      }

      console.log("New log");
      res.redirect("/your-page?success=true");
    });
  }
);

app.get("/api/feed", async (req, res) => {
  let logs = await DailyLog.find()
    .sort({ createdAt: -1 })
    .limit(10)
    .skip(10 * Number(req.query.page || 0));

  res.json({
    logs: await Promise.all(logs.map(async log => {
      const user = await User.findOne({ username: log.user });
      return {
        ...log.toObject(),
        task: user && user.task,
      };
    })),
  });
});

app.post(
  "/api/add-task/:user",
  loggedIn,
  [body("task").isString().trim()],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    User.findOneAndUpdate(
      { username: req.params.user },
      { task: req.body.task },
      { new: true, useFindAndModify: false }
    )
      .then((doc) => {
        res.redirect("/your-page");
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error adding Task");
      });
  }
);

// Public User page
app.get("/user/:user/", async (req, res) => {
  let loggedInUser = req.user || false;
  let publicUser = req.params.user;
  let userTask = await User.findOne({ username: publicUser }, "task -_id");
  res.render("publicUser", {
    loggedInUser: loggedInUser,
    publicUser: publicUser,
    userTask: userTask,
  });
});

// Specific Day
app.get("/log/:user/:day", loggedIn, async (req, res) => {
  let dailyLog = await DailyLog.findOne({
    user: req.params.user,
    day: req.params.day,
  });
  let isLogOwner;
  if (req.user.login === req.params.user) {
    logOwner = true;
  } else {
    logOwner = false;
  }
  dailyLog.proof = decodeURIComponent(dailyLog.proof);
  res.render("log", {
    loggedInUser: req.user.login,
    loggedInUserPic: req.user.profile_pic_url,
    dailyLog: dailyLog,
    isLogOwner: isLogOwner,
    logOwner: req.params.user,
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

app.get("/api/stats", async (req, res) => {
  let users = await User.find({}, "username profile_pic_url -_id");
  let logs = await DailyLog.find({}, "-_id");
  let stats = {
    users: users,
    logs: logs,
  };
  res.status(200).send(stats);
});

app.get("/api/user-tasks", async (req, res) => {
  let tasks = await User.find({}, "username task -_id");
  res.send(tasks);
});

app.get("/api/user-pic/:user", async (req, res) => {
  let picObject = await User.findOne(
    { username: req.params.user },
    "profile_pic_url -_id"
  );
  let userPic = picObject.profile_pic_url;
  res.redirect(userPic);
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
                profile_pic_url: profile.profile_image_url,
                provider: "twitch",
              });
              console.log("New user created");

              user.save();
              return done(null, profile);
            } else {
              console.log("User already exists");
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
