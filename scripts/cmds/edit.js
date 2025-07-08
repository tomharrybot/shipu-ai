const fs = require("fs");
const path = require("path");
const axios = require("axios");

module.exports = {
  config: {
    name: "edit",
    aliases: ["imgedit", "art", "artify"],
    version: "1.1",
    author: "Chitron Bhattacharjee",
    countDown: 20,
    role: 2,
    shortDescription: {
      en: "✨ Kawaii image edit"
    },
    longDescription: {
      en: "🖼️ Reply to an image and give a magical anime-style edit prompt 💫"
    },
    category: "🖌️ Image",
    guide: {
      en: "💬 Reply to an image:\n+edit <your anime prompt>\n💡 Example: +edit cute magical girl style"
    }
  },

  onStart: async function ({ api, event, args, message, usersData }) {
    if (!event.messageReply || event.messageReply.attachments.length === 0) {
      return message.reply("💢 𝙃𝙚𝙮~ 𝙔𝙤𝙪 𝙢𝙪𝙨𝙩 𝙧𝙚𝙥𝙡𝙮 𝙩𝙤 𝙖𝙣 𝙞𝙢𝙖𝙜𝙚 𝙩𝙤 𝙪𝙨𝙚 𝙩𝙝𝙞𝙨 ✨");
    }

    const prompt = args.join(" ");
    if (!prompt) {
      return message.reply("📌 𝙋𝙡𝙚𝙖𝙨𝙚 𝙖𝙙𝙙 𝙖 𝙥𝙧𝙤𝙢𝙥𝙩 𝙩𝙤 𝙚𝙙𝙞𝙩 𝙩𝙝𝙚 𝙞𝙢𝙖𝙜𝙚 💬");
    }

    const imageUrl = event.messageReply.attachments[0].url;
    const userData = await usersData.get(event.senderID) || {};
    const balance = userData.money || 0;

    if (balance < 100) {
      return message.reply("💸 𝙉𝙤𝙩 𝙚𝙣𝙤𝙪𝙜𝙝 𝙘𝙤𝙞𝙣𝙨~! 𝙔𝙤𝙪 𝙣𝙚𝙚𝙙 𝟏𝟎𝟎 💰");
    }

    // Deduct 100 coins
    await usersData.set(event.senderID, {
      money: balance - 100
    });

    // Send temporary coin deduction notice
    api.sendMessage("💰 𝟏𝟎𝟎 𝙘𝙤𝙞𝙣𝙨 𝙙𝙚𝙙𝙪𝙘𝙩𝙚𝙙 𝙛𝙤𝙧 𝙖𝙣𝙞𝙢𝙚 𝙚𝙙𝙞𝙩~ ✨", event.threadID, (err, info) => {
      if (!err) {
        setTimeout(() => {
          api.unsendMessage(info.messageID);
        }, 10000);
      }
    });

    message.reply("🪄 𝙃𝙤𝙡𝙙 𝙤𝙣~ 𝙀𝙙𝙞𝙩𝙞𝙣𝙜 𝙞𝙣 𝙘𝙪𝙩𝙚 𝙥𝙧𝙤𝙜𝙧𝙚𝙨𝙨... 💞");

    try {
      const editApiUrl = `https://mahi-apis.onrender.com/api/edit?url=${encodeURIComponent(imageUrl)}&txt=${encodeURIComponent(prompt)}`;
      const response = await axios.get(editApiUrl, { responseType: "arraybuffer" });

      const cacheFolder = path.join(__dirname, "cache");
      if (!fs.existsSync(cacheFolder)) fs.mkdirSync(cacheFolder);

      const filePath = path.join(cacheFolder, `${Date.now()}_anime_edit.jpg`);
      fs.writeFileSync(filePath, Buffer.from(response.data, "binary"));

      const stream = fs.createReadStream(filePath);
      message.reply({
        body: `🌸 𝘌𝘥𝘪𝘵 𝘊𝘰𝘮𝘱𝘭𝘦𝘵𝘦~!\n✨ 𝘗𝘳𝘰𝘮𝘱𝘵: 『${prompt}』`,
        attachment: stream
      });
    } catch (e) {
      console.log(e);
      message.reply("🚫 𝙐𝙝-𝙤𝙝! 𝙁𝙖𝙞𝙡𝙚𝙙 𝙩𝙤 𝙚𝙙𝙞𝙩 𝙩𝙝𝙚 𝙞𝙢𝙖𝙜𝙚... 𝙏𝙧𝙮 𝙖𝙜𝙖𝙞𝙣 𝙡𝙖𝙩𝙚𝙧 💔");
    }
  },

  onChat: async function ({ message, event, args, usersData }) {
    if (event.type !== "message_reply" || !event.messageReply.attachments[0]?.type?.includes("photo")) return;
    if (!args[0]) return;
    return this.onStart(...arguments);
  }
};
