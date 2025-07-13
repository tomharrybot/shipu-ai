const fs = require("fs-extra");
const path = require("path");

const CACHE_DIR = path.join(__dirname, "..", "cache");
const CACHE_FILE = path.join(CACHE_DIR, "deletedMessages.json");
const MAX_AGE_MS = 1000 * 60 * 60 * 2; // 2 hours cache max age

class DeletedMessagesCache {
  constructor() {
    this.cache = new Map(); // Map<threadID, Map<messageID, messageData>>
    this._loadCache();
  }

  async _loadCache() {
    try {
      await fs.ensureDir(CACHE_DIR);
      if (await fs.pathExists(CACHE_FILE)) {
        const data = await fs.readJSON(CACHE_FILE);
        for (const [threadID, msgs] of Object.entries(data)) {
          this.cache.set(threadID, new Map(Object.entries(msgs)));
        }
      }
    } catch (e) {
      console.error("Failed to load deleted messages cache:", e);
    }
  }

  async _saveCache() {
    try {
      const obj = {};
      for (const [threadID, msgs] of this.cache.entries()) {
        obj[threadID] = Object.fromEntries(msgs.entries());
      }
      await fs.writeJSON(CACHE_FILE, obj, { spaces: 2 });
    } catch (e) {
      console.error("Failed to save deleted messages cache:", e);
    }
  }

  async set(threadID, messageID, messageData) {
    if (!this.cache.has(threadID)) {
      this.cache.set(threadID, new Map());
    }
    this.cache.get(threadID).set(messageID, { ...messageData, _time: Date.now() });
    await this._saveCache();
  }

  get(threadID, messageID) {
    if (!this.cache.has(threadID)) return null;
    const msg = this.cache.get(threadID).get(messageID);
    if (!msg) return null;
    if (Date.now() - msg._time > MAX_AGE_MS) {
      this.cache.get(threadID).delete(messageID);
      this._saveCache(); // async save
      return null;
    }
    return msg;
  }
}

const deletedMessagesCache = new DeletedMessagesCache();

module.exports = {
  config: {
    name: "resend",
    version: "1.0",
    author: "Chitron Bhattacharjee",
    description: "Resend deleted messages if enabled",
    category: "events"
  },

  langs: {
    en: {
      resendOn: "✅ Resend feature enabled in this thread.",
      resendOff: "❌ Resend feature disabled in this thread.",
      noPermission: "⚠️ You must be admin to toggle resend feature.",
      deletedMsgResent: "⚠️ Message deleted by %1:\n\n%2"
    }
  },

  onStart: async function ({ event, threadsData, api, message, getLang, usersData }) {
    const threadID = event.threadID;

    // Save messages to cache on any message event
    if (event.type === "message" && (event.body || (event.attachments && event.attachments.length))) {
      const senderName = await usersData.getName(event.senderID);
      await deletedMessagesCache.set(threadID, event.messageID, {
        senderID: event.senderID,
        senderName,
        body: event.body || "",
        attachments: event.attachments || []
      });
    }

    // Handle +resend on/off toggle commands by admin
    if (event.type === "message" && event.body) {
      const lowerBody = event.body.toLowerCase();
      if (lowerBody === "+resend on" || lowerBody === "+resend off") {
        const threadData = await threadsData.get(threadID);
        if (!threadData.adminIDs.includes(event.senderID)) {
          return api.sendMessage(getLang("noPermission"), threadID, event.messageID);
        }
        threadData.data = threadData.data || {};
        threadData.data.resendEnabled = lowerBody.endsWith("on");
        await threadsData.set(threadID, threadData.data, "data");
        return api.sendMessage(
          threadData.data.resendEnabled ? getLang("resendOn") : getLang("resendOff"),
          threadID,
          event.messageID
        );
      }
    }

    // Resend deleted messages if enabled
    if (event.logMessageType === "log:unsubscribe" || event.logMessageType === "message_unsend") {
      const threadData = await threadsData.get(threadID);
      if (!threadData.data?.resendEnabled) return;

      const unsentMsgID = event.logMessageData?.messageID || event.messageID;
      if (!unsentMsgID) return;

      const cachedMsg = deletedMessagesCache.get(threadID, unsentMsgID);
      if (!cachedMsg) return;

      const senderName = cachedMsg.senderName || "Unknown";
      const resendBody = getLang("deletedMsgResent", senderName, cachedMsg.body || "(No text)");

      const form = { body: resendBody };
      if (cachedMsg.attachments?.length) form.attachment = cachedMsg.attachments;

      api.sendMessage(form, threadID);
    }
  }
};
