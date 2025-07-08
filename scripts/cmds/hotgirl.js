const axios = require("axios");
const fs = require("fs");
const path = require("path");

const sexyTexts = [
  "💦 Ahnn~ b-baby... I'm so wet for you 🥵",
  "🥺 F**k me harder daddy, I'm begging 💋",
  "👅 Ufff~ I'm gonna cummmm 😩💦",
  "🫦 Yesss! Right there! Aaaaah~ 😫🔥",
  "👀 T-take me... I'm all yours tonight 💦",
  "😈 Treat me like your lil’ anime slut~ 💋",
  "👅 Don’t stopppp~ Ughhh I'm losing it 🥵",
  "💀 A-ahh baby... you broke me 💦",
  "👄 Your hot girl is ready... come claim me 😏",
  "💦 Awhh~ this pic will make u go NUTS 😛"
];

module.exports = {
  config: {
    name: "hotgirl",
    aliases: [],
    version: "1.1",
    author: "Chitron Bhattacharjee",
    countDown: 5,
    role: 0,
    shortDescription: {
      en: "🔞 Sends a hot NSFW girl pic"
    },
    longDescription: {
      en: "Auto sends a sexy NSFW girl image from Delirius API 🔥"
    },
    category: "18+",
    guide: {
      en: "Just type 'hot girl' in chat"
    }
  },

  onStart: async function () {}, // dummy for install support

  onChat: async function ({ event, message }) {
    const content = event.body?.toLowerCase();
    if (!content) return;

    if (content.includes("hot girl") || content.includes("hotgirl") || content.includes("sexy girl")) {
      const url = "https://delirius-apiofc.vercel.app/nsfw/girls";
      const fileName = `hotgirl_${Date.now()}.jpg`;
      const filePath = path.join(__dirname, "cache", fileName);

      try {
        const response = await axios.get(url, { responseType: "stream" });
        const writer = fs.createWriteStream(filePath);
        response.data.pipe(writer);

        writer.on("finish", () => {
          const randomText = sexyTexts[Math.floor(Math.random() * sexyTexts.length)];
          message.reply({
            body: `🔥 𝐘𝐨𝐮𝐫 𝐝𝐢𝐫𝐭𝐲 𝐝𝐨𝐬𝐞 𝐢𝐬 𝐡𝐞𝐫𝐞, 𝐛𝐚𝐛𝐲...\n${randomText}`,
            attachment: fs.createReadStream(filePath)
          }, () => fs.unlinkSync(filePath));
        });

        writer.on("error", err => {
          console.error(err);
          message.reply("❌ Failed to save image!");
        });

      } catch (e) {
        console.error(e);
        message.reply("⚠ Unable to fetch hot girl image.");
      }
    }
  }
};
