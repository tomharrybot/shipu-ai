const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "shit",
    version: "2.0",
    author: "Chitron Bhattacharjee",
    countDown: 5,
    role: 0,
    shortDescription: { en: "random shit image" },
    description: { en: "shit image with bold caption" },
    category: "fun",
    guide: { en: "{p}shit or just type message starting with shit" }
  },

  onStart: async function ({ message }) {
    return sendShit(message);
  },

  onChat: async function ({ message, event }) {
    const body = (event.body || "").toLowerCase().trim();
    if (body === "shit" || body.startsWith("shit ")) {
      return sendShit(message);
    }
  }
};

async function sendShit(message) {
  const captions = [
    "𝙏𝙝𝙞𝙨 𝙡𝙤𝙤𝙠𝙨 𝙡𝙞𝙠𝙚 𝙞𝙩 𝙘𝙖𝙢𝙚 𝙤𝙪𝙩 𝙤𝙛 𝙝𝙚𝙡𝙡 💩",
    "𝙎𝙝𝙖𝙧𝙠 𝙩𝙖𝙣𝙠 𝙧𝙚𝙟𝙚𝙘𝙩𝙚𝙙 𝙩𝙝𝙞𝙨 🦈",
    "𝙎𝙚𝙣𝙙 𝙩𝙝𝙞𝙨 𝙩𝙤 𝙮𝙤𝙪𝙧 𝙚𝙭 😈",
    "𝙏𝙝𝙞𝙨 𝙜𝙖𝙧𝙗𝙖𝙜𝙚 𝙝𝙖𝙨 𝙬𝙞-𝙛𝙞 📡",
    "𝙁𝙧𝙚𝙨𝙝 𝙤𝙪𝙩 𝙤𝙛 𝙩𝙝𝙚 𝙙𝙞𝙜𝙞𝙩𝙖𝙡 𝙩𝙤𝙞𝙡𝙚𝙩 🚽",
    "𝙀𝙫𝙚𝙣 𝙖 𝙧𝙖𝙩 𝙧𝙚𝙛𝙪𝙨𝙚𝙙 𝙩𝙝𝙞𝙨 🐀",
    "𝙁𝙤𝙧𝙗𝙞𝙙𝙙𝙚𝙣 𝙛𝙖𝙧𝙩 𝙖𝙧𝙩 🎨",
    "𝙍𝙚𝙫𝙞𝙚𝙬𝙚𝙙 𝙗𝙮 𝙎𝙖𝙩𝙖𝙣 😈⭐",
    "𝙎𝙘𝙧𝙖𝙥𝙥𝙚𝙙 𝙛𝙧𝙤𝙢 𝘾𝙝𝙖𝙩𝙂𝙋𝙏’𝙨 𝙙𝙧𝙖𝙞𝙣 🧠",
    "𝙄 𝙙𝙞𝙙 𝙣𝙤𝙩 𝙘𝙤𝙣𝙨𝙚𝙣𝙩 𝙩𝙤 𝙨𝙚𝙚 𝙩𝙝𝙞𝙨 🙅",
    "𝙒𝙝𝙮 𝙞𝙨 𝙞𝙩 𝙨𝙩𝙞𝙘𝙠𝙮⁉️",
    "𝘽𝙞𝙧𝙩𝙝 𝙤𝙛 𝙖 𝙣𝙞𝙜𝙝𝙩𝙢𝙖𝙧𝙚 🌙",
    "𝙎𝙩𝙧𝙖𝙞𝙜𝙝𝙩 𝙤𝙪𝙩𝙩𝙖 𝙖𝙞-𝙝𝙚𝙡𝙡 💀",
    "𝙄 𝙘𝙖𝙣 𝙩𝙖𝙨𝙩𝙚 𝙩𝙝𝙚 𝙨𝙪𝙛𝙛𝙚𝙧𝙞𝙣𝙜 🤢",
    "𝙁𝙖𝙞𝙡𝙚𝙙 𝙖𝙧𝙩 𝙥𝙞𝙚𝙘𝙚 𝙤𝙧 𝙖 𝙘𝙧𝙞𝙢𝙚 𝙨𝙘𝙚𝙣𝙚? 🖼️",
    "𝙈𝙖𝙙𝙚 𝙞𝙣 𝙝𝙖𝙩𝙚 💔",
    "𝙒𝙖𝙨𝙝 𝙮𝙤𝙪𝙧 𝙚𝙮𝙚𝙨 𝙣𝙤𝙬 🧼👀",
    "𝙎𝙤𝙘𝙞𝙚𝙩𝙮 𝙞𝙨 𝙣𝙤𝙩 𝙧𝙚𝙖𝙙𝙮 𝙛𝙤𝙧 𝙩𝙝𝙞𝙨 📉",
    "𝙀𝙫𝙚𝙣 𝙜𝙤𝙙 𝙘𝙧𝙞𝙣𝙜𝙚𝙙 🙏"
  ];

  const caption = captions[Math.floor(Math.random() * captions.length)];
  const credit = "𝐀𝐏𝐈 𝐛𝐲: 𝐂𝐡𝐢𝐭𝐫𝐨𝐧 𝐁𝐡𝐚𝐭𝐭𝐚𝐜𝐡𝐚𝐫𝐣𝐞𝐞 🌐";

  try {
    const res = await axios.get("http://shipu.c0m.in/shit/", {
      responseType: "arraybuffer",
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });

    const contentType = res.headers["content-type"] || "";
    let ext = ".jpg";
    if (contentType.includes("png")) ext = ".png";
    else if (contentType.includes("jpeg")) ext = ".jpeg";

    const filename = `shit_${Date.now()}${ext}`;
    const filepath = path.join(__dirname, "cache", filename);

    await fs.ensureDir(path.dirname(filepath));
    await fs.writeFile(filepath, res.data);

    await message.reply({
      body: `${caption}\n\n${credit}`,
      attachment: fs.createReadStream(filepath)
    });

    fs.unlink(filepath);
  } catch (err) {
    console.error("SHIT_FETCH_ERROR:", err.message);
    message.reply("❌ 𝘍𝘢𝘪𝘭𝘦𝘥 𝘵𝘰 𝘭𝘰𝘢𝘥 𝘴𝘩𝘪𝘵.");
  }
                     }
