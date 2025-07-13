const fs = require("fs-extra");
const path = require("path");

const authorID = "100081330372098"; // Chitron Bhattacharjee's UID
const maintainFilePath = path.resolve(__dirname, "../config/maintain.json");

module.exports = {
  config: {
    name: "dev",
    version: "1.0",
    author: "Chitron Bhattacharjee",
    countDown: 5,
    role: 2,
    shortDescription: {
      en: "✨ Toggle bot maintenance mode ✨"
    },
    longDescription: {
      en: "✨ Enable or disable bot maintenance mode (dev mode) with cute style ✨"
    },
    category: "admin",
    guide: {
      en: "🌸 +dev on — enable maintenance\n🌸 +dev off — disable maintenance"
    }
  },

  langs: {
    en: {
      noPermission: "❌✨ 𝓢𝓸𝓻𝓻𝔂 𝓑𝓾𝓽 𝓸𝓷𝓵𝔂 𝓜𝔂 𝓐𝓾𝓽𝓱𝓸𝓻 𝓬𝓪𝓷 𝓬𝓱𝓪𝓷𝓰𝓮 𝓶𝓪𝓲𝓷𝓽𝓮𝓷𝓪𝓷𝓬𝓮 𝓶𝓸𝓭𝓮! 💖",
      enabled: "💚 𝓜𝓪𝓲𝓷𝓽𝓮𝓷𝓪𝓷𝓬𝓮 𝓜𝓸𝓭𝓮 𝓲𝓼 𝓷𝓸𝔀 𝓔𝓝𝓐𝓑𝓛𝓔𝓓! 💻✨\n🌟 𝓤𝓼𝓮𝓻𝓼 𝔀𝓲𝓵𝓵 𝓫𝓮 𝓷𝓸𝓽𝓲𝓯𝓲𝓮𝓭 𝓪𝓫𝓸𝓾𝓽 𝓾𝓹𝓭𝓪𝓽𝓮𝓼 𝓪𝓷𝓭 𝓵𝓲𝓶𝓲𝓽𝓮𝓭 𝓬𝓸𝓶𝓶𝓪𝓷𝓭𝓼. 🌈",
      disabled: "❤️ 𝓜𝓪𝓲𝓷𝓽𝓮𝓷𝓪𝓷𝓬𝓮 𝓜𝓸𝓭𝓮 𝓱𝓪𝓼 𝓫𝓮𝓮𝓷 𝓓𝓘𝓢𝓐𝓑𝓛𝓔𝓓! 🌟\n🎉 𝓑𝓸𝓽 𝓲𝓼 𝓫𝓪𝓬𝓴 𝓽𝓸 𝓷𝓸𝓻𝓶𝓪𝓵 𝓸𝓹𝓮𝓻𝓪𝓽𝓲𝓸𝓷. 💖",
      maintenanceMsg: "⏳✨ 𝓞𝓱𝓷𝓸! 𝓣𝓱𝓮 𝓫𝓸𝓽 𝓲𝓼 𝓾𝓷𝓭𝓮𝓻 𝓶𝓪𝓲𝓷𝓽𝓮𝓷𝓪𝓷𝓬𝓮 𝓯𝓸𝓻 𝓷𝓮𝔀 𝓾𝓹𝓭𝓪𝓽𝓮𝓼! 🌸\n💌 𝓢𝓸𝓶𝓮 𝓬𝓸𝓶𝓶𝓪𝓷𝓭𝓼 𝓶𝓪𝔂 𝓷𝓸𝓽 𝔀𝓸𝓻𝓴 𝓻𝓲𝓰𝓱𝓽 𝓷𝓸𝔀.\n🙏 𝓟𝓵𝓮𝓪𝓼𝓮 𝓫𝓮 𝓹𝓪𝓽𝓲𝓮𝓷𝓽! 💖"
      ,
      invalidUsage: "❌🌸 𝓞𝓱 𝓷𝓸! 𝓘𝓷𝓿𝓪𝓵𝓲𝓭 𝓾𝓼𝓪𝓰𝓮.\n✨ 𝓤𝓼𝓮:\n🌷 +dev on\n🌷 +dev off"
    }
  },

  _readMaintainState: function () {
    try {
      if (!fs.existsSync(maintainFilePath)) {
        fs.writeFileSync(maintainFilePath, JSON.stringify({ enabled: false }, null, 2));
        return { enabled: false };
      }
      return JSON.parse(fs.readFileSync(maintainFilePath));
    } catch {
      return { enabled: false };
    }
  },

  _writeMaintainState: function (state) {
    try {
      fs.writeFileSync(maintainFilePath, JSON.stringify({ enabled: state }, null, 2));
      return true;
    } catch {
      return false;
    }
  },

  onStart: async function ({ args, event, message }) {
    if (event.senderID !== authorID)
      return message.reply(this.langs.en.noPermission);

    if (!args[0])
      return message.reply(this.langs.en.invalidUsage);

    const arg = args[0].toLowerCase();

    if (arg === "on") {
      const success = this._writeMaintainState(true);
      if (success) return message.reply(this.langs.en.enabled);
      else return message.reply("❌✨ 𝓕𝓪𝓲𝓵𝓮𝓭 𝓽𝓸 𝓮𝓷𝓪𝓫𝓵𝓮 𝓶𝓪𝓲𝓷𝓽𝓮𝓷𝓪𝓷𝓬𝓮 𝓶𝓸𝓭𝓮.");
    } else if (arg === "off") {
      const success = this._writeMaintainState(false);
      if (success) return message.reply(this.langs.en.disabled);
      else return message.reply("❌✨ 𝓕𝓪𝓲𝓵𝓮𝓭 𝓽𝓸 𝓭𝓲𝓼𝓪𝓫𝓵𝓮 𝓶𝓪𝓲𝓷𝓽𝓮𝓷𝓪𝓷𝓬𝓮 𝓶𝓸𝓭𝓮.");
    } else {
      return message.reply(this.langs.en.invalidUsage);
    }
  },

  onChat: async function ({ event, message }) {
    const state = this._readMaintainState();

    if (state.enabled && event.senderID !== authorID) {
      const prefix = global.utils.getPrefix(event.threadID) || "+";
      if (event.body?.startsWith(prefix)) {
        return message.reply(this.langs.en.maintenanceMsg);
      }
    }
  }
};
