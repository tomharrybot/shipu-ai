const { loadImage, createCanvas } = require("canvas");
const fs = require("fs-extra");
const path = require("path");
const https = require("https");

module.exports = {
  config: {
    name: "groupstats",
    version: "1.0",
    author: "Chitron Bhattacharjee",
    countDown: 10,
    role: 0,
    shortDescription: { en: "Group stats image" },
    longDescription: { en: "Generate an image of group statistics including name, admins, members, avatars." },
    category: "group",
    guide: { en: "Say 'groupstats' to trigger" }
  },

  onChat: async function ({ api, event, message, threadsData }) {
    if (!["groupstats", "group stat", "group info"].includes(event.body?.toLowerCase())) return;

    try {
      const threadInfo = await api.getThreadInfo(event.threadID);
      const members = threadInfo.participantIDs || [];
      const admins = threadInfo.adminIDs?.map(e => e.id) || [];

      const canvasWidth = 900, canvasHeight = 500;
      const canvas = createCanvas(canvasWidth, canvasHeight);
      const ctx = canvas.getContext("2d");

      // Styles
      const options = {
        colour: "#ffffff",
        admincolour: "#ff9800",
        membercolour: "#2196f3"
      };

      // Background
      ctx.fillStyle = "#20232a";
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // Group Name
      ctx.font = "28px Arial";
      ctx.fillStyle = options.colour;
      ctx.textAlign = "center";
      ctx.fillText(threadInfo.threadName || "Unknown Group", canvasWidth / 2, 50);

      // Admins and Members
      ctx.font = "16px Arial";
      ctx.textAlign = "left";
      ctx.strokeStyle = options.admincolour;
      ctx.lineWidth = 1;
      ctx.strokeText(`Admins: ${admins.length}`, 20, 100);
      ctx.fillText(`Admins: ${admins.length}`, 20, 100);

      ctx.textAlign = "right";
      ctx.strokeText(`Members: ${members.length}`, canvasWidth - 20, 100);
      ctx.fillText(`Members: ${members.length}`, canvasWidth - 20, 100);

      // Load profile pictures
      const profileSize = 60, gap = 15, maxPerRow = 10;
      let x = 20, y = 130, col = 0;
      for (let id of admins.concat(members.filter(id => !admins.includes(id))).slice(0, 50)) {
        const imgBuffer = await downloadImage(`https://graph.facebook.com/${id}/picture?width=100&height=100`);
        const img = await loadImage(imgBuffer);

        ctx.save();
        ctx.beginPath();
        ctx.arc(x + profileSize / 2, y + profileSize / 2, profileSize / 2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(img, x, y, profileSize, profileSize);
        ctx.restore();

        // Border
        ctx.lineWidth = 2;
        ctx.strokeStyle = admins.includes(id) ? options.admincolour : options.membercolour;
        ctx.beginPath();
        ctx.arc(x + profileSize / 2, y + profileSize / 2, profileSize / 2, 0, Math.PI * 2);
        ctx.stroke();

        col++;
        x += profileSize + gap;
        if (col >= maxPerRow) {
          col = 0;
          x = 20;
          y += profileSize + gap;
        }
      }

      const imgPath = path.join(__dirname, "cache", `groupstats_${event.threadID}.png`);
      fs.ensureDirSync(path.dirname(imgPath));
      fs.writeFileSync(imgPath, canvas.toBuffer());

      return message.reply({
        body: "🧾 Group Statistics",
        attachment: fs.createReadStream(imgPath)
      });

    } catch (err) {
      console.error(err);
      message.reply("❌ Error generating group stats image.");
    }
  },

  onStart: async function () {} // Required for install
};

// Image downloader helper
function downloadImage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      const data = [];
      res.on("data", (chunk) => data.push(chunk));
      res.on("end", () => resolve(Buffer.concat(data)));
    }).on("error", reject);
  });
    }
