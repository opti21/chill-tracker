const router = require("express").Router();
const moment = require("moment-timezone");
const User = require("../models/users");
const Task = require("../models/newTasks");
const DailyLog = require("../models/newDailyLogs");
const { nanoid } = require("nanoid");
const discordClient = require("../discordClient");
const { body, validationResult } = require("express-validator");

function loggedIn(req, res, next) {
  if (!req.user) {
    res.redirect("/login");
  } else {
    next();
  }
}

router.post(
  "/add-task/",
  loggedIn,
  [body("task").isString().trim()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        errors: errors.array(),
      });
    }

    // console.log(req.body)

    let dayArray = [];
    let dateFormated = new Date(req.body.startdate).toISOString();

    for (let i = 0; i < 30; i++) {
      let day = {
        day: i + 1,
        date: moment
          .tz(req.body.startdate, req.body.timezone)
          .add(i, "days")
          .format(),
        completed: false,
      };
      dayArray.push(day);
    }

    // console.log(dayArray)

    let newTask = new Task({
      id: nanoid(10),
      user: req.user.id,
      task: req.body.task,
      days: dayArray,
      timezone: req.body.timezone,
    });

    newTask
      .save()
      .then((result) => {
        res.redirect("/your-page");
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error adding Task");
      });
  }
);

router.post(
  "/newlog/:taskid/:day",
  loggedIn,
  [
    body("logtext").isString().not().isEmpty().trim(),
    body("proof").isString().trim(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        errors: errors.array(),
      });
    }

    let newLog = new DailyLog({
      user: req.user.id,
      taskID: req.params.taskid,
      title: req.body.logtitle,
      text: req.body.logtext,
      proof: req.body.proof,
      day: req.params.day,
    });

    newLog.save(async (err, log) => {
      if (err) {
        console.error(err);
        res.status(500).send("Error creating new log");
      }

      let oldTask = await Task.findOne({
        id: req.params.taskid,
        user: req.user.id,
      });

      let oldDays = oldTask.days;

      oldDays[req.params.day - 1] = {
        day: oldDays[req.params.day - 1].day,
        date: oldDays[req.params.day - 1].date,
        completed: true,
      };

      let newDays = oldDays;

      await Task.findOneAndUpdate(
        {
          user: req.user.id,
          id: req.params.taskid,
        },
        {
          days: newDays,
        },
        {
          useFindAndModify: false,
        },
        (err, doc) => {
          // console.log('Task Updated')
          // console.log(doc)
        }
      );

      try {
        let discordChannel = discordClient.channels.cache.find(
          (ch) => ch.name === "30-day-challenge📅"
        );
        //console.log(discordChannel);
        if (!discordChannel) {
          return res.redirect("/your-page?success=true");
        } else {
          let exclamations = ["Great job", "Way to go", "Sweet as"];
          let exclamation =
            exclamations[Math.floor(Math.random() * exclamations.length)];

          let title;

          if (req.body.logtitle === undefined) {
            title = "No Title";
          } else {
            title = req.body.logtitle;
          }

          let logEmbed = {
            content: `${req.user.login} added a new log. ${exclamation} ${req.user.login}!`,
            embed: {
              title: `${title}`,
              description: `**Log:**\n${req.body.logtext}`,
              url: `${process.env.APP_URL}/log/${log.user}/${log.id}/${log.day}`,
              color: 1168657,
              author: {
                name: req.user.login,
                icon_url: req.user.profile_pic_url,
              },
            },
          };

          // console.log(logEmbed);
          discordChannel.send(logEmbed);

          // Send regular message with link proof so discord generates a link preview
          if (req.body.proof.length > 0) {
            discordChannel.send(`${req.user.login}'s proof: ` + req.body.proof);
          }
        }
      } catch (err) {
        console.error(err);
      }

      res.redirect("/your-page?success=true");
    });
  }
);

router.get("/task/:id", loggedIn, (req, res) => {
  Task.findOne({ id: req.params.id })
    .then((result) => {
      res.send(result);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send("Error finding task => " + err);
    });
});

router.get("/feed", async (req, res) => {
  let logs = await DailyLog.find()
    .sort({
      createdAt: -1,
    })
    .limit(10)
    .skip(10 * Number(req.query.page || 0));
  // console.log(logs)

  res.json({
    logs: await Promise.all(
      logs.map(async (log) => {
        const user = await User.findOne({
          twitch_id: log.user,
        });
        console.log(user);
        return {
          ...log.toObject(),
          pfp: user.profile_pic_url,
          username: user.username,
        };
      })
    ),
  });
});

router.get("/logs/:user", async (req, res) => {
  let user = await User.findOne({
    username: req.params.user,
  });
  let dailyLogs = await DailyLog.find({
    user: user.twitch_id,
  });
  res.status(200).send(dailyLogs);
});

router.get("/stats", async (req, res) => {
  let users = await User.find({}, "username profile_pic_url -_id");
  let tasks = await Task.find({});
  let stats = {
    users: users,
    tasks: tasks,
  };
  res.status(200).send(stats);
});

router.get("/user-tasks", async (req, res) => {
  let tasks = await User.find({}, "username task -_id");
  res.send(tasks);
});

router.get("/user-pic/:user", async (req, res) => {
  let picObject = await User.findOne(
    {
      twitch_id: req.params.user,
    },
    "profile_pic_url -_id"
  );
  let userPic = picObject.profile_pic_url;
  res.redirect(userPic);
});

module.exports = router;
