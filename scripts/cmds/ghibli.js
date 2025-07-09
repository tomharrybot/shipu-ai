const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "ghibli",
    aliases: ["ghiblipic", "ghiblipack"],
    version: "1.0",
    author: "Chitron Bhattacharjee",
    countDown: 10,
    role: 0,
    shortDescription: {
      en: "Send 6 Ghibli-style artworks 🌸"
    },
    description: {
      en: "Fetches 6 beautiful Studio Ghibli aesthetic wallpapers from Wallhaven API"
    },
    category: "anime",
    guide: {
      en: "Use: +ghibli6\nGet 6 anime wallpapers inspired by Studio Ghibli ✨"
    }
  },

  onStart: async function ({ message }) {
    const apiUrl = "https://wallhaven.cc/api/v1/search?q=ghibli&purity=100&categories=100&atleast=1920x1080&sorting=random&ratios=16x9&resolutions=1920x1080&topRange=1d";

    try {
      const res = await axios.get(apiUrl);
      const wallpapers = res.data.data;

      if (!wallpapers.length) {
        return message.reply("⚠️ No Ghibli-style wallpapers found right now. Try again later!");
      }

      const selected = wallpapers.slice(0, 6);
      const attachments = [];

      for (const wp of selected) {
        const imgUrl = wp.path;
        const fileName = `ghibli_${wp.id}.jpg`;
        const filePath = path.join(__dirname, "cache", fileName);

        const imgRes = await axios.get(imgUrl, { responseType: "arraybuffer" });
        await fs.outputFile(filePath, imgRes.data);

        attachments.push(fs.createReadStream(filePath));
      }

      const msg = `🌸 𝙂𝙝𝙞𝙗𝙡𝙞 𝘼𝙧𝙩𝙬𝙤𝙧𝙠 𝙋𝙖𝙘𝙠 🌸

✨ 6 aesthetic images inspired by Studio Ghibli ✨
📷 Source: wallhaven.cc
🎐 Resolution: 1920x1080
🎀 Enjoy the magic of Totoro, Spirited Away, and more!

💖 Stay cozy, anime lover!`;

      return message.reply({
        body: msg,
        attachment: attachments
      });

    } catch (err) {
      console.error(err);
      return message.reply("🚫 Failed to fetch Ghibli images. Please try again later.");
    }
  }
};