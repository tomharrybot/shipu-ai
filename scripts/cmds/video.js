
// 💮 video.js – 𝑨𝒏𝒊𝒎𝒆 𝒀𝒕 𝑽𝒊𝒅 𝑫𝒍
// ➤ Match chat: video song-name or link
// 🐇 Made with love by Chitron Bhattacharjee

const axios  = require("axios");
const fs     = require("fs-extra");
const path   = require("path");

// 🩷 Load base API URL from file: api.txt
const baseApiUrl = async () => {
  const file = path.join(__dirname, "api.txt");
  return fs.readFileSync(file, "utf-8").trim();
};

module.exports = {
  config: {
    name: "video",
    version: "4.0",
    author: "Chitron Bhattacharjee",
    countDown: 15,
    role: 0,
    shortDescription: { en: "Kawaii YouTube DL" },
    description:      { en: "Search or download YouTube in anime style" },
    category: "media",
    guide: {
  en: "🌸 𝙐𝙨𝙖𝙜𝙚:\n🎀 video Your Song Name\n🎀 video YouTube Link\n🩵 Then reply with a number to download"
}


  },

  onStart: async () => {},

  onChat: async function ({ api, event }) {
    const body = event.body?.trim();
    if (!body?.toLowerCase().startsWith("video")) return;

    const args = body.slice(5).trim();
    if (!args)
      return api.sendMessage("🌸 𝑷𝒍𝒆𝒂𝒔𝒆 𝒕𝒚𝒑𝒆 𝒂 𝒔𝒐𝒏𝒈 𝒏𝒂𝒎𝒆 𝒐𝒓 𝒍𝒊𝒏𝒌!", event.threadID, event.messageID);

    if (args.startsWith("http://") || args.startsWith("https://")) {
      await this.download(api, event, args);
    } else {
      await this.search(api, event, args);
    }
  },

  download: async function (api, event, url, title = "unknown", time = "??:??") {
    try {
      const apiUrl = await baseApiUrl();
      const res = await axios.get(\`\${apiUrl}/nazrul/ytMp4?url=\${encodeURIComponent(url)}\`);
      if (!res.data?.d_url) throw new Error("No download link!");

      const filePath = path.join(__dirname, "animevid.mp4");
      const writer = fs.createWriteStream(filePath);
      const stream = (await axios.get(res.data.d_url, { responseType: "stream" })).data;
      stream.pipe(writer);

      writer.on("finish", () => {
        api.sendMessage({
          body:
\`🌸 𝙃𝙚𝙧𝙚'𝙨 𝙮𝙤𝙪𝙧 𝙘𝙪𝙩𝙚 𝙫𝙞𝙙𝙚𝙤 🍡

📀 𝑻𝒊𝒕𝒍𝒆: \${res.data.title}
⏰ 𝑫𝒖𝒓𝒂𝒕𝒊𝒐𝒏: \${time}\`,
          attachment: fs.createReadStream(filePath)
        }, event.threadID, () => fs.unlinkSync(filePath), event.messageID);
      });

      writer.on("error", err => {
        api.sendMessage(\`❌ Error: \${err.message}\`, event.threadID, event.messageID);
      });

    } catch (e) {
      api.sendMessage(\`❌ \${e.message}\`, event.threadID, event.messageID);
    }
  },

  search: async function (api, event, query) {
    try {
      const apiUrl = await baseApiUrl();
      const res = await axios.get(\`\${apiUrl}/nazrul/ytSearch?query=\${encodeURIComponent(query)}\`);
      const list = res.data;

      if (!list || list.length === 0)
        return api.sendMessage("❌ 𝙉𝙤 𝙫𝙞𝙙𝙨 𝙛𝙤𝙪𝙣𝙙!", event.threadID, event.messageID);

      let msg = \`🌟 𝙏𝙤𝙥 10 𝙖𝙣𝙞𝙢𝙚-𝙨𝙩𝙮𝙡𝙚 𝙧𝙚𝙨𝙪𝙡𝙩𝙨:

\`;
      const paths = [], attachments = [];

      for (let i = 0; i < Math.min(10, list.length); i++) {
        const vid = list[i];
        msg += \`🍓 #\${i + 1}: \${vid.title}
⏳ \${vid.timestamp}

\`;

        const imgPath = path.join(__dirname, \`thumb_\${i}.jpg\`);
        const stream = (await axios.get(vid.thumbnail, { responseType: "stream" })).data;
        await new Promise(resolve => stream.pipe(fs.createWriteStream(imgPath)).on("finish", resolve));

        attachments.push(fs.createReadStream(imgPath));
        paths.push(imgPath);
      }

      api.sendMessage({ body: msg, attachment: attachments }, event.threadID, (err, info) => {
        if (!err) {
          global.GoatBot.onReply.set(info.messageID, {
            commandName: this.config.name,
            type: "reply",
            author: event.senderID,
            messageID: info.messageID,
            results: list,
            thumbs: paths
          });
        }
      }, event.messageID);

    } catch (e) {
      api.sendMessage(\`❌ \${e.message}\`, event.threadID, event.messageID);
    }
  },

  onReply: async function ({ api, event, Reply }) {
    if (event.senderID !== Reply.author) return;

    const idx = parseInt(event.body.trim()) - 1;
    if (isNaN(idx) || idx < 0 || idx >= Reply.results.length)
      return api.sendMessage("🔢 𝑰𝒏𝒗𝒂𝒍𝒊𝒅 𝒏𝒖𝒎𝒃𝒆𝒓!", event.threadID, event.messageID);

    // Clean up thumbs
    Reply.thumbs.forEach(p => fs.existsSync(p) && fs.unlinkSync(p));
    api.unsendMessage(Reply.messageID);

    const chosen = Reply.results[idx];
    await this.download(api, event, chosen.url, chosen.title, chosen.timestamp);
  }
};
