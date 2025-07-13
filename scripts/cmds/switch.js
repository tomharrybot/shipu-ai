const fs = require("fs-extra");
const axios = require("axios");
const path = require("path");

const URL_STORE_PATH = path.join(__dirname, "cookie_url.json"); // persist URL here
const DEV_COOKIE_PATH = path.join(__dirname, "account.dev.txt");

// Ensure directory exists before writing file
async function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  await fs.ensureDir(dir);
}

// Save or load URL functions
async function saveUrl(url) {
  await ensureDir(URL_STORE_PATH);
  await fs.writeFile(URL_STORE_PATH, JSON.stringify({ url }), "utf-8");
}
async function loadUrl() {
  if (!await fs.pathExists(URL_STORE_PATH)) return null;
  const data = await fs.readFile(URL_STORE_PATH, "utf-8");
  try {
    return JSON.parse(data).url || null;
  } catch {
    return null;
  }
}

// Function to fetch cookie from URL
async function fetchCookieFromUrl(url) {
  try {
    const res = await axios.get(url);
    if (res.status === 200 && res.data) {
      return res.data.trim();
    }
    throw new Error("Failed to fetch cookie data");
  } catch (error) {
    return null;
  }
}

// Dummy login function (replace with your bot login method)
async function botLogin(cookie) {
  console.log("Logging in with cookie:", cookie.substring(0, 10) + "...");
  return true;
}

// Switch bot account by fetching cookie from saved URL
async function switchBotAccount(message) {
  const url = await loadUrl();
  if (!url) {
    return message.reply("❌ Cookie URL not set. Use +switch <url> to set it.");
  }
  const cookie = await fetchCookieFromUrl(url);
  if (!cookie) {
    return message.reply("❌ Failed to fetch cookie from URL.");
  }
  await ensureDir(DEV_COOKIE_PATH);
  await fs.writeFile(DEV_COOKIE_PATH, cookie, "utf-8");
  const loginSuccess = await botLogin(cookie);
  if (loginSuccess) {
    message.reply("✅ Switched bot account successfully!");
  } else {
    message.reply("❌ Failed to login with new cookie.");
  }
}

module.exports = {
  config: {
    name: "switch",
    version: "1.0",
    author: "Chitron Bhattacharjee",
    countDown: 5,
    role: 2,
    shortDescription: {
      en: "Set cookie URL for bot account switching"
    },
    longDescription: {
      en: "Set the URL to fetch the bot login cookie for automatic account switching"
    },
    category: "admin",
    guide: {
      en: "{pn} <url> - Set cookie URL"
    }
  },

  langs: {
    en: {
      missingUrl: "❌ Please provide the cookie URL.",
      setUrlSuccess: "✅ Cookie URL saved successfully!",
      noCookieUrl: "❌ No cookie URL set. Use +switch <url> to set.",
      fetchFailed: "❌ Failed to fetch cookie from URL.",
      switchSuccess: "✅ Switched bot account successfully!",
      switchFailed: "❌ Failed to login with new cookie."
    }
  },

  onStart: async function({ args, message, getLang }) {
    if (!args[0]) return message.reply(getLang("missingUrl"));
    const url = args[0];
    if (!url.startsWith("http")) return message.reply("❌ Invalid URL format.");

    await saveUrl(url);
    return message.reply(getLang("setUrlSuccess"));
  },

  switchBotAccount
};
