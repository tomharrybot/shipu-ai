const fs = require("fs");
const path = require("path");
const axios = require("axios");

module.exports = {
  config: {
    name: "edit",
    aliases: ["imgedit", "art", "artify"],
    version: "1.2",
    author: "Chitron Bhattacharjee",
    countDown: 20,
    role: 2,
    shortDescription: {
      en: "✨ Kawaii image edit"
    },
    longDescription: {
      en: "🖼️ Reply to an image and give a magical anime‑style edit prompt 💫"
    },
    category: "🖌️ Image",
    guide: {
      en: "💬 Reply to an image:\n+edit <your anime prompt>\n💡 Example: +edit cute magical girl style"
    }
  },

  /* ─────────────────────────────── MAIN HANDLER ─────────────────────────────── */
  onStart: async function ({ api, event, args, message, usersData }) {
    if (!event.messageReply || event.messageReply.attachments.length === 0)
      return message.reply("💢 𝙃𝙚𝙮~ 𝙮𝙤𝙪 𝙣𝙚𝙚𝙙 𝙩𝙤 𝙧𝙚𝙥𝙡𝙮 𝙩𝙤 𝙖𝙣 𝙞𝙢𝙖𝙜𝙚 ✨");

    const prompt = args.join(" ").trim();
    if (!prompt)
      return message.reply("📌 𝙋𝙡𝙚𝙖𝙨𝙚 𝙖𝙙𝙙 𝙖𝙣 𝙚𝙙𝙞𝙩 𝙥𝙧𝙤𝙢𝙥𝙩 💬");

    const imageUrl = event.messageReply.attachments[0].url;
    const userData = await usersData.get(event.senderID) || {};
    const balance  = userData.money || 0;

    if (balance < 100)
      return message.reply("💸 𝙉𝙤𝙩 𝙚𝙣𝙤𝙪𝙜𝙝 𝙘𝙤𝙞𝙣𝙨~! 𝙔𝙤𝙪 𝙣𝙚𝙚𝙙 𝟏𝟎𝟎 💰");

    await usersData.set(event.senderID, { money: balance - 100 });

    api.sendMessage(
      "💰 𝟏𝟎𝟎 𝙘𝙤𝙞𝙣𝙨 𝙙𝙚𝙙𝙪𝙘𝙩𝙚𝙙 𝙛𝙤𝙧 𝙖𝙣𝙞𝙢𝙚 𝙚𝙙𝙞𝙩~ ✨",
      event.threadID,
      (e, info) => !e && setTimeout(() => api.unsendMessage(info.messageID), 10_000)
    );

    message.reply("🪄 𝙃𝙤𝙡𝙙 𝙤𝙣~ 𝙘𝙪𝙩𝙚 𝙚𝙙𝙞𝙩𝙞𝙣𝙜 𝙞𝙣 𝙥𝙧𝙤𝙜𝙧𝙚𝙨𝙨... 💞");

    try {
      const apiURL = `https://mahi-apis.onrender.com/api/edit?url=${encodeURIComponent(imageUrl)}&txt=${encodeURIComponent(prompt)}`;
      const res    = await axios.get(apiURL, { responseType: "arraybuffer" });

      const cache  = path.join(__dirname, "cache");
      if (!fs.existsSync(cache)) fs.mkdirSync(cache);

      const file   = path.join(cache, `${Date.now()}_anime_edit.jpg`);
      fs.writeFileSync(file, Buffer.from(res.data, "binary"));

      message.reply({
        body: `🌸 𝘌𝘥𝘪𝘵 𝘊𝘰𝘮𝘱𝘭𝘦𝘵𝘦~!\n✨ 𝘗𝘳𝘰𝘮𝘱𝘵: 『${prompt}』`,
        attachment: fs.createReadStream(file)
      });
    } catch (err) {
      console.error(err);
      message.reply("🚫 𝙐𝙝‑𝙤𝙝! 𝙁𝙖𝙞𝙡𝙚𝙙 𝙩𝙤 𝙚𝙙𝙞𝙩 𝙩𝙝𝙚 𝙞𝙢𝙖𝙜𝙚... 𝙩𝙧𝙮 𝙖𝙜𝙖𝙞𝙣 𝙡𝙖𝙩𝙚𝙧 💔");
    }
  },

  /* ───────────────────────────── NO‑PREFIX MODE ────────────────────────────── */
  onChat: async function (context) {
    const { event, args } = context;

    /* Only react to replies that contain an image */
    if (event.type !== "message_reply" ||
        !event.messageReply.attachments[0]?.type?.includes("photo"))
      return;

    /* First word must be a valid command keyword */
    const cmd = (args[0] || "").toLowerCase();
    const keys = ["edit", "imgedit", "art", "artify"];
    if (!keys.includes(cmd)) return;

    /* Remove the command name so the rest becomes the prompt */
    args.shift();

    /* Forward to main handler with trimmed args */
    return this.onStart({ ...context, args });
  }
};
