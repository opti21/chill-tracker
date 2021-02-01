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
const helmet = require("helmet");
const moment = require("moment-timezone");
const { nanoid } = require("nanoid");

// Discord bot

// Models
const User = require("./models/users");
const Task = require("./models/newTasks");
const oldTask = require("./models/Tasks");
const DailyLog = require("./models/newDailyLogs");
const oldDailyLog = require("./models/dailyLogs");

app.use(helmet());
app.set("trust proxy", 1);
app.set("views", "./views");
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
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

const db = mongoose.connection;

db.on("error", (error) => {
  console.error(error);
});

async function updateTasks() {
  let oldTasks = await oldTask.find({});

  oldTasks.forEach(async (task) => {
    console.log(task.user)
    let newID = nanoid(10);
    let user = await User.findOne({ username: task.user });
    let newTask = new Task({
      id: newID,
      user: user.twitch_id,
      task: task.task,
      days: task.days,
    });

    await newTask.save();
    console.log("updated task")

    let oldDailyLogs = await oldDailyLog.find({ user: task.user });
    oldDailyLogs.forEach(async (log) => {
      let newlog = new DailyLog({
        taskID: newID,
        user: user.twitch_id,
        day: log.day,
        title: log.title,
        text: log.text,
        proof: log.proof,
        completed: log.completed,
      });

      await newlog.save();
      console.log("updated log")
    });
  });
}

updateTasks();

//Routes
app.get("/", async (req, res) => {
  let loggedInUser = req.user || false;
  let dailyLogs = await DailyLog.find().limit(10).sort({
    createdAt: -1,
  });
  res.render("feed", {
    loggedInUser: loggedInUser,
    dailyLogs: dailyLogs,
  });
});

app.get("/auth/twitch", passport.authenticate("twitch.js"));
app.get(
  "/auth/twitch/callback",
  passport.authenticate("twitch.js", {
    failureRedirect: "/",
  }),
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

app.get("/add-task", loggedIn, (req, res) => {
  let user = req.user || false;
  res.render("add-task", {
    loggedInUser: user,
  });
});

app.get("/your-page", loggedIn, async (req, res) => {
  let alert;
  if (!req.query.a) {
    alert = "";
  } else {
    alert = req.query.a;
  }

  try {
    // console.log(req.user.login)

    let tasks = await Task.find(
      {
        user: req.user.id,
      },
      (err, doc) => {
        if (err) console.error(err);
        // console.log(doc)
      }
    );

    // console.log(task)

    let hasTask;
    if (tasks.length === 0) {
      hasTasks = false;
    } else {
      hasTasks = true;
    }
    res.render("your-page", {
      loggedInUser: req.user.login,
      hasTasks: hasTasks,
      tasks: tasks,
    });
  } catch (e) {
    console.error(e);
    res.status(500).send(`${e}`);
  }
});

// Create new task
// TODO: Move rest of routes to files
const apiRoute = require("./routes/api");

app.use("/api", apiRoute);

app.get("/newlog/:task/:day", loggedIn, (req, res) => {
  res.render("new-log", {
    loggedInUser: req.user.login,
    logDay: req.params.day,
    taskID: req.params.task,
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

// Public User page
app.get("/user/:user/", async (req, res) => {
  let loggedInUser = req.user || false;
  let publicUser = req.params.user;
  let userTask = await User.findOne({
    username: publicUser,
  });
  res.render("publicUser", {
    loggedInUser: loggedInUser,
    publicUser: publicUser,
    userTask: userTask,
  });
});

//Task page
app.get("/edit-task/:id", loggedIn, async (req, res) => {
  let loggedInUser = req.user || false;
  let task = await Task.findOne({ id: req.params.id });

  let isTaskOwner;
  if (task.user != req.user.id) {
    isTaskOwner = false;
  } else {
    isTaskOwner = true;
  }

  console.log(isTaskOwner);

  res.render("task", {
    loggedInUser: loggedInUser,
    isTaskOwner: isTaskOwner,
    task: task,
  });
});

app.get("/task/:id", async (req, res) => {
  let loggedInUser = req.user || false;
  let task = await Task.findOne({ id: req.params.id });

  res.render("public-task", {
    loggedInUser: loggedInUser,
    task: task,
  });
});

// Specific Day
app.get("/log/:task/:day", loggedIn, async (req, res) => {
  try {
    let dailyLog = await DailyLog.findOne({
      taskID: req.params.task,
      day: req.params.day,
    });

    let task = await Task.findOne({
      user: dailyLog.user,
      id: req.params.task,
    });

    let logOwner = await User.findOne({
      twitch_id: dailyLog.user,
    });
    console.log(logOwner.username);

    let isLogOwner;
    if (dailyLog.user === req.user.id) {
      isLogOwner = true;
    } else {
      isLogOwner = false;
    }

    //console.log(dailyLog);

    res.render("log", {
      loggedInUser: req.user.login,
      loggedInUserPic: req.user.profile_pic_url,
      logText: dailyLog.text,
      logProof: decodeURIComponent(dailyLog.proof),
      logDay: dailyLog.day,
      task: task,
      isLogOwner: isLogOwner,
      logOwner: logOwner.username,
    });
  } catch (e) {
    console.error(e);
  }
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
        User.findOne({
          twitch_id: profile.id,
        })
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

db.once("open", () => {
  console.log("Connected to Mongoose " + Date());

  server.listen(port);
});
