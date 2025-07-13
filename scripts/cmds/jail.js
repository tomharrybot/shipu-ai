const DIG = require("discord-image-generation");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "jail",
    version: "1.1",
    author: "Chitron Bhattacharjee",
    countDown: 5,
    role: 0,
    shortDescription: "Jail image",
    longDescription: "Make someone jailed with a funny effect",
    category: "image",
    guide: {
      en: "{pn} @mention"
    }
  },

  langs: {
    vi: {
      noTag: "Bạn phải tag người mà bạn muốn bỏ vào tù"
    },
    en: {
      noTag: "You must tag the person you want to jail"
    }
  },

  onStart: async function ({ event, message, usersData, args, getLang }) {
    const uid2 = Object.keys(event.mentions)[0];
    if (!uid2)
      return message.reply(getLang("noTag"));

    const avatarURL = await usersData.getAvatarUrl(uid2);
    const image = await new DIG.Jail().getImage(avatarURL);

    const tmpPath = path.join(__dirname, "tmp");
    const filePath = path.join(tmpPath, `${uid2}_jail.png`);

    await fs.ensureDir(tmpPath); // ensures tmp dir exists
    fs.writeFileSync(filePath, Buffer.from(image));

    const content = args.join(" ").replace(event.mentions[uid2], "").trim();

    message.reply({
      body: `${content || "🚔 You're in jail!"}`,
      attachment: fs.createReadStream(filePath)
    }, () => fs.unlinkSync(filePath));
  }
};
