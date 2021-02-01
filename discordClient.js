const Discord = require("discord.js");
const discordClient = new Discord.Client();

discordClient.on("ready", () => {
  console.log(`Logged in as ${discordClient.user.tag}!`);
});

discordClient.on("message", msg => {
  if (msg.content === "ping") {
    msg.reply("pong");
  }
});

discordClient.login(process.env.DISCORD_TOKEN);

module.exports = discordClient
