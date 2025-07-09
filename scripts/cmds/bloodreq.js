const { getStreamsFromAttachment } = global.utils;

module.exports = {
  config: {
    name: "blood",
    aliases: ["bloodreq", "bloodrequest"],
    version: "1.0",
    author: "Chitron Bhattacharjee",
    countDown: 5,
    role: 0,
    description: {
      en: "Collect blood request info step-by-step and broadcast to all groups"
    },
    category: "general",
    guide: {
      en: "{pn} — start blood request form"
    }
  },

  langs: {
    en: {
      start: "🩸 𝘽𝙡𝙤𝙤𝙙 𝙍𝙚𝙦𝙪𝙚𝙨𝙩 🩸\n\nPlease reply with *Disease* (e.g. Cancer ♋):",
      missingDisease: "❌ *Please provide your disease!*",
      missingBlood: "❌ *Please provide your blood group!*",
      missingLocation: "❌ *Please provide your location!*",
      missingContact: "❌ *Please provide your contact info!*",
      confirm: "✨ *Confirm your blood request info:*\n\n🦠 Disease: *%1*\n🩸 Blood: *%2*\n📍 Location: *%3*\n📞 Contact: %4\n\nReply *yes* to send, or *no* to cancel.",
      cancelled: "❌ *Blood request cancelled.*",
      sending: "🚀 Sending your blood request to all groups...",
      sent: "✅ *Blood request sent successfully to %1 groups!*",
      errorSend: "❌ *Errors occurred sending to %1 groups:* \n%2",
      invalidConfirm: "⚠️ Please reply with *yes* or *no*.",
      noPermission: "🚫 You don't have permission to use this command.",
    }
  },

  onStart: async function({ message, api, event, commandName, getLang }) {
    if (message.senderID !== api.getCurrentUserID() && message.senderID !== message.threadID && message.senderID !== event.senderID) {
      // no special role check for now, role 0 means all users
    }

    return message.reply(getLang("start"));
  },

  onReply: async function({ Reply, event, api, getLang, message, threadsData }) {
    // fallback threadsData if not injected
    threadsData = threadsData || global.controllers?.threadsData;

    const { author, data } = Reply || {};
    if (event.senderID !== author) return;

    data.disease = data.disease || null;
    data.blood = data.blood || null;
    data.location = data.location || null;
    data.contact = data.contact || null;
    data.step = data.step || 1;

    const input = event.body?.trim();

    switch (data.step) {
      case 1: // Disease
        if (!input) return api.sendMessage(getLang("missingDisease"), event.threadID, event.messageID);
        data.disease = input;
        data.step = 2;
        return api.sendMessage("🩸 Blood Group: (e.g. O negative (O-), A+, B-)", event.threadID, event.messageID, (e, info) => {
          global.GoatBot.onReply.set(info.messageID, {
            commandName: Reply.commandName,
            messageID: info.messageID,
            author,
            data,
          });
        });

      case 2: // Blood group
        if (!input) return api.sendMessage(getLang("missingBlood"), event.threadID, event.messageID);
        data.blood = input;
        data.step = 3;
        return api.sendMessage("📍 Location: (e.g. Mymensingh)", event.threadID, event.messageID, (e, info) => {
          global.GoatBot.onReply.set(info.messageID, {
            commandName: Reply.commandName,
            messageID: info.messageID,
            author,
            data,
          });
        });

      case 3: // Location
        if (!input) return api.sendMessage(getLang("missingLocation"), event.threadID, event.messageID);
        data.location = input;
        data.step = 4;
        return api.sendMessage("📞 *Contact:* (e.g. Facebook URL, phone)", event.threadID, event.messageID, (e, info) => {
          global.GoatBot.onReply.set(info.messageID, {
            commandName: Reply.commandName,
            messageID: info.messageID,
            author,
            data,
          });
        });

      case 4: // Contact
        if (!input) return api.sendMessage(getLang("missingContact"), event.threadID, event.messageID);
        data.contact = input;
        data.step = 5;
        // confirmation message with bold italic style and emojis
        return api.sendMessage(getLang("confirm", data.disease, data.blood, data.location, data.contact), event.threadID, event.messageID, (e, info) => {
          global.GoatBot.onReply.set(info.messageID, {
            commandName: Reply.commandName,
            messageID: info.messageID,
            author,
            data,
          });
        });

      case 5: // Confirm send
        if (!["yes", "no"].includes(input.toLowerCase())) {
          return api.sendMessage(getLang("invalidConfirm"), event.threadID, event.messageID);
        }
        if (input.toLowerCase() === "no") {
          return api.sendMessage(getLang("cancelled"), event.threadID, event.messageID);
        }

        // Send message to all groups
        await api.sendMessage(getLang("sending"), event.threadID);

        // Prepare final message
        const finalMessage = `🩸 ——𝐁𝐥𝐨𝐨𝐝 𝐑𝐞𝐪𝐮𝐞𝐬𝐭—— 🩸\n\n` +
          `🦠 Disease: _${data.disease}_\n` +
          `🩸 Blood: _${data.blood}_\n` +
          `📍 Location: _${data.location}_\n\n` +
          `📞 Contact: ${data.contact}`;

        // Get all groups where bot is present
        const allThreads = (await threadsData.getAll()).filter(
          t => t.isGroup && t.members.some(m => m.userID === api.getCurrentUserID())
        );

        let sendSuccess = 0;
        const sendErrors = [];

        for (const thread of allThreads) {
          try {
            await api.sendMessage(finalMessage, thread.threadID);
            sendSuccess++;
          } catch (e) {
            sendErrors.push(thread.threadID);
          }
        }

        let replyMsg = `✅ *Blood request sent successfully to ${sendSuccess} groups!*`;
        if (sendErrors.length)
          replyMsg += `\n❌ *Failed to send to ${sendErrors.length} groups.*`;

        return api.sendMessage(replyMsg, event.threadID, event.messageID);

      default:
        return api.sendMessage("❌ *Unexpected step. Please restart the command.*", event.threadID, event.messageID);
    }
  }
};