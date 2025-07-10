const axios = require("axios");
const path = require("path");
const fs = require("fs-extra");

module.exports = {
  config: {
    name: "pinterest",
    aliases: ["pin"],
    version: "1.0",
    author: "Chitron Bhattacharjee",
    role: 0,
    countDown: 5,
    shortDescription: {
      en: "Search Pinterest for images"
    },
    longDescription: {
      en: "Search for images from Pinterest using a keyword. Returns up to 20 images."
    },
    category: "media",
    guide: {
      en: "{pn} <keyword> - <count>\nExample:\n{pn} cat - 5"
    }
  },

  onStart: async function ({ api, event, args, getLang }) {
    try {
      const input = args.join(" ");
      if (!input.includes("-")) {
        return api.sendMessage(
          `📌 Please provide a search keyword and number of images.\n\n📥 Example:\npin cat - 5`,
          event.threadID,
          event.messageID
        );
      }

      const searchQuery = input.substring(0, input.indexOf("-")).trim();
      let imageCount = parseInt(input.split("-").pop()) || 6;
      imageCount = Math.min(Math.max(imageCount, 1), 20); // Ensure 1–20

      const apiUrl = `https://aryan-error-api.onrender.com/pinterest?search=${encodeURIComponent(searchQuery)}&count=${imageCount}`;
      const res = await axios.get(apiUrl);

      if (!res.data || !Array.isArray(res.data.data)) {
        throw new Error("⚠ API returned invalid data format.");
      }

      const imageLinks = res.data.data;
      const cacheDir = path.join(__dirname, "cache");
      await fs.ensureDir(cacheDir);

      const attachments = [];

      for (let i = 0; i < imageLinks.length; i++) {
        const imageUrl = imageLinks[i];
        try {
          const imgRes = await axios.get(imageUrl, {
            responseType: "arraybuffer",
            headers: {
              'User-Agent': 'Mozilla/5.0'
            }
          });

          const filename = `pin_${Date.now()}_${i}.jpg`;
          const filePath = path.join(cacheDir, filename);
          await fs.writeFile(filePath, imgRes.data);
          attachments.push(fs.createReadStream(filePath));
        } catch (err) {
          console.error(`❌ Error downloading ${imageUrl}: ${err.message}`);
        }
      }

      if (attachments.length === 0) {
        return api.sendMessage(`❌ No images could be downloaded. Try again later.`, event.threadID, event.messageID);
      }

      await api.sendMessage({
        body: `📍 Result for: ${searchQuery} (${attachments.length} images)`,
        attachment: attachments
      }, event.threadID, event.messageID);

      // Clean up
      await fs.emptyDir(cacheDir);

    } catch (error) {
      console.error(error);
      return api.sendMessage(`❌ Error: ${error.message}`, event.threadID, event.messageID);
    }
  }
};
