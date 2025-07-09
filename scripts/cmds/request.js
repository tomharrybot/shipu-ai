const ftp = require("basic-ftp");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "request",
    version: "1.1",
    author: "Chitron Bhattacharjee",
    countDown: 5,
    role: 0,
    shortDescription: {
      en: "Send a request to admin"
    },
    description: {
      en: "User requests will be saved in admin FTP"
    },
    category: "utility",
    guide: {
      en: "Type: request <your message>\nOr just say: request: <your message>"
    }
  },

  // Dummy onStart for command installation compatibility
  onStart: async function () {},

  // 🧠 onChat trigger for no-prefix usage
  onChat: async function ({ event, message, usersData }) {
    const body = event.body?.trim();
    if (!body) return;

    // 🧩 Trigger pattern match
    if (!/^request\s|^request:/i.test(body)) return;

    const FTP_CONFIG = {
      host: "ftpupload.net",
      user: "cpfr_39361582",
      password: "chitron@2448766",
      secure: false,
      port: 21
    };

    const userID = event.senderID;
    const userInfo = await usersData.get(userID);
    const senderName = userInfo?.name || "Unknown";
    const username = userInfo?.username || "Unknown";

    // Extract actual request message
    const requestText = body.replace(/^request\s*:?\s*/i, "").trim();
    if (!requestText) return message.reply("⚠️ Please type your request after the word 'request'.");

    const content = `Sender name: ${senderName}
Sender username: ${username}
Sender uid: ${userID}
Request data: ${requestText}`;

    // Write to local temp file
    const cacheDir = path.join(__dirname, "cache/request");
    await fs.ensureDir(cacheDir);

    const fileList = await fs.readdir(cacheDir);
    const requestNumber = fileList.length + 1;
    const fileName = `request${requestNumber}.txt`;
    const filePath = path.join(cacheDir, fileName);
    await fs.writeFile(filePath, content);

    // FTP Upload
    const client = new ftp.Client();
    try {
      await client.access(FTP_CONFIG);
      await client.ensureDir("/htdocs/request");
      await client.uploadFrom(filePath, `/htdocs/request/${fileName}`);
      message.reply(`📩 Your request has been sent to admin as **${fileName}** successfully!`);
    } catch (err) {
      console.error("❌ FTP Upload Error:", err);
      message.reply("❌ Failed to send your request. Please try again later.");
    } finally {
      client.close();
      await fs.remove(filePath);
    }
  }
};
