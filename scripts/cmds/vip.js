const { getStreamsFromAttachment } = global.utils;
const mediaTypes = ["photo", "png", "animated_image", "video", "audio"];
const { config } = global.GoatBot;
const { client } = global;
const vipModel = global.models.vipModel;

const OWNER_UID = "100081330372098"; // Always treated as VIP

module.exports = {
  config: {
    name: "vip",
    version: "1.0",
    author: "Chitron Bhattacharjee",
    countDown: 5,
    role: 0,
    shortDescription: { en: "handle vip members" },
    longDescription: { en: "handle vip members" },
    category: "admin",
    guide: {
      en: "{p}vip <msg> to message VIPs\n{p}vip add <uid>\n{p}vip remove <uid>\n{p}vip list\n{p}vip on/off"
    }
  },

  langs: {
    en: {
      missingMessage: "💖 𝒴𝑜𝓊 𝓃𝑒𝑒𝒹 𝓉𝑜 𝒷𝑒 𝒶 𝒱𝐼𝒫 𝓂𝑒𝓂𝒷𝑒𝓇 𝓉𝑜 𝓊𝓈𝑒 𝓉𝒽𝒾𝓈 𝒻𝑒𝒶𝓉𝓊𝓇𝑒~ 💕",
      sendByGroup: "\n🌸 𝓢𝓮𝓷𝓽 𝓯𝓻𝓸𝓶 𝓰𝓻𝓸𝓾𝓹: %1\n🌼 𝓣𝓱𝓻𝓮𝓪𝓭 𝓘𝓓: %2",
      sendByUser: "\n✨ 𝓢𝓮𝓷𝓽 𝓯𝓻𝓸𝓶 𝓾𝓼𝓮𝓻",
      content: "\n\n🌟 𝓒𝓸𝓷𝓽𝓮𝓷𝓽: %1\n🌈 𝓡𝓮𝓹𝓵𝔂 𝓽𝓸 𝓼𝓮𝓷𝓭 𝓶𝓮𝓼𝓼𝓪𝓰𝓮",
      success: "🎉 𝒴𝓸𝓾𝓻 𝓜𝓮𝓼𝓼𝓪𝓰𝓮 𝘄𝓪𝓼 𝓼𝓾𝓬𝓬𝓮𝓼𝓼𝒻𝓾𝓁𝓁𝓎 𝓼𝓮𝓷𝓽 𝓽𝓸 𝓥𝐼𝒫! 💌\n%2",
      failed: "🚫 𝓢𝓸𝓻𝓻𝔂! 𝓕𝓪𝓲𝓵𝓮𝓭 𝓽𝓸 𝓼𝓮𝓷𝓭 𝔂𝓸𝓾𝓻 𝓶𝓮𝓼𝓼𝓪𝓰𝓮 𝓽𝓸 𝓥𝐼𝒫! ❌\n%2",
      reply: "💬 𝓡𝓮𝓹𝓵𝔂 𝓯𝓻𝓸𝓶 𝓥𝐼𝒫 %1:\n%2",
      replySuccess: "✨ 𝓨𝓸𝓾𝓻 𝓻𝓮𝓹𝓵𝔂 𝘄𝓪𝓼 𝓼𝓾𝓬𝓬𝓮𝓼𝓼𝒻𝓾𝓁𝓁𝓎 𝓼𝓮𝓷𝓽! 🎀",
      feedback: "📝 𝓕𝓮𝓮𝓭𝓫𝓪𝓬𝓴 𝓯𝓻𝓸𝓶 𝓥𝐼𝒫 𝓾𝓼𝓮𝓻 %1:\n- 𝓤𝓼𝓮𝓻 𝓘𝓓: %2\n%3\n\n🌸 𝓒𝓸𝓷𝓽𝓮𝓷𝓽: %4",
      replyUserSuccess: "🌈 𝓨𝓸𝓾𝓻 𝓻𝓮𝓹𝓵𝔂 𝔀𝓪𝓼 𝓼𝓾𝓬𝓬𝓮𝓼𝓼𝓯𝓾𝓁! 💖",
      noAdmin: "⚠️ 𝓨𝓸𝓾 𝓭𝓸𝓷'𝓽 𝓱𝓪𝓿𝓮 𝓹𝓮𝓻𝓶𝓲𝓼𝓼𝓲𝓸𝓷 𝓽𝓸 𝓹𝓮𝓻𝓯𝓸𝓻𝓶 𝓽𝓱𝓲𝓼 𝓪𝓬𝓽𝓲𝓸𝓷! ❌",
      addSuccess: "🎀 𝓢𝓾𝓬𝓬𝓮𝓼𝓼𝓯𝓾𝓁𝓁𝔂 𝓪𝓭𝓭𝓮𝓭 𝓽𝓸 𝓥𝐼𝒫 𝓵𝓲𝓼𝓽! 💎",
      alreadyInVIP: "✨ 𝓣𝓱𝓲𝓼 𝓾𝓼𝓮𝓻 𝓲𝓼 𝓪𝓵𝓻𝓮𝓪𝓭𝔂 𝓲𝓷 𝓥𝐼𝒫 𝓵𝓲𝓼𝓽! ❗",
      removeSuccess: "💔 𝓡𝓮𝓶𝓸𝓿𝓮𝓭 𝓯𝓻𝓸𝓶 𝓥𝐼𝒫 𝓵𝓲𝓼𝓽! 🥀",
      notInVIP: "❗ 𝓣𝓱𝓲𝓼 𝓾𝓼𝓮𝓻 𝓲𝓼 𝓷𝓸𝓽 𝓲𝓷 𝓥𝐼𝒫 𝓵𝓲𝓼𝓽!",
      list: "🌟 𝓛𝓲𝓼𝓽 𝓸𝓯 𝓥𝐼𝒫 𝓜𝓮𝓶𝓫𝓮𝓻𝓼:\n%1",
      vipModeEnabled: "💫 𝓥𝐼𝒫 𝓶𝓸𝓭𝓮 𝓮𝓷𝓪𝓫𝓵𝓮𝓭! 🎉",
      vipModeDisabled: "🌙 𝓥𝐼𝒫 𝓶𝓸𝓭𝓮 𝓭𝓲𝓼𝓪𝓫𝓵𝓮𝓭! 💤"
    }
  },

  onStart: async function ({ args, message, event, usersData, api, commandName, getLang }) {
    const { senderID, threadID } = event;
    if (!config.adminBot.includes(senderID))
      return message.reply(getLang("noAdmin"));

    if (args[0] === "on") {
      try {
        config.whiteListMode.enable = true;
        const vipDocs = await vipModel.find({});
        const dbIDs = vipDocs.map(v => v.userId);
        if (!dbIDs.includes(OWNER_UID)) dbIDs.push(OWNER_UID);
        config.whiteListMode.whiteListIds = dbIDs;
        await require("fs").promises.writeFile(client.dirConfig, JSON.stringify(config, null, 2));
        return message.reply(getLang("vipModeEnabled"));
      } catch (err) {
        console.error(err);
        return message.reply("❌ Error enabling VIP mode.");
      }
    }

    if (args[0] === "off") {
      try {
        config.whiteListMode.enable = false;
        await require("fs").promises.writeFile(client.dirConfig, JSON.stringify(config, null, 2));
        return message.reply(getLang("vipModeDisabled"));
      } catch (err) {
        console.error(err);
        return message.reply("❌ Error disabling VIP mode.");
      }
    }

    if (args[0] === "add" && args[1]) {
      const uid = args[1];
      if (uid === OWNER_UID)
        return message.reply("⚠️ Cannot add owner again!");
      const exists = await vipModel.findOne({ userId: uid });
      if (exists) return message.reply(getLang("alreadyInVIP"));
      await vipModel.create({ userId: uid });
      return message.reply(getLang("addSuccess"));
    }

    if (args[0] === "remove" && args[1]) {
      const uid = args[1];
      if (uid === OWNER_UID)
        return message.reply("❌ Cannot remove owner from VIP list!");
      const exists = await vipModel.findOne({ userId: uid });
      if (!exists) return message.reply(getLang("notInVIP"));
      await vipModel.deleteOne({ userId: uid });
      return message.reply(getLang("removeSuccess"));
    }

    if (args[0] === "list") {
      const vipDocs = await vipModel.find({});
      const allUIDs = [...new Set([...vipDocs.map(v => v.userId), OWNER_UID])];
      const vipList = await Promise.all(allUIDs.map(async uid => {
        const name = await usersData.getName(uid);
        return `${uid} - (${name})`;
      }));
      return message.reply(getLang("list", vipList.join("\n")));
    }

    if (!config.whiteListMode.enable)
      return message.reply("🔒 VIP mode is off. Turn it on to use this feature.");

    const isVip = senderID === OWNER_UID || await vipModel.findOne({ userId: senderID });
    if (!isVip) return message.reply(getLang("missingMessage"));
    if (!args[0]) return message.reply(getLang("missingMessage"));

    const senderName = await usersData.getName(senderID);
    const msg = `==📨 VIP MESSAGE 📨==\n- User Name: ${senderName}\n- User ID: ${senderID}`;

    const formMessage = {
      body: msg + getLang("content", args.join(" ")),
      mentions: [{ id: senderID, tag: senderName }],
      attachment: await getStreamsFromAttachment(
        [...event.attachments, ...(event.messageReply?.attachments || [])]
          .filter(item => mediaTypes.includes(item.type))
      )
    };

    try {
      const messageSend = await api.sendMessage(formMessage, threadID);
      global.GoatBot.onReply.set(messageSend.messageID, {
        commandName,
        messageID: messageSend.messageID,
        threadID,
        messageIDSender: event.messageID,
        type: "userCallAdmin"
      });
    } catch (err) {
      console.error(err);
      return message.reply(getLang("failed"));
    }
  },

  onReply: async ({ args, event, api, message, Reply, usersData, commandName, getLang }) => {
    const { type, threadID, messageIDSender } = Reply;
    const senderName = await usersData.getName(event.senderID);
    const { isGroup } = event;

    switch (type) {
      case "userCallAdmin": {
        const formMessage = {
          body: getLang("reply", senderName, args.join(" ")),
          mentions: [{ id: event.senderID, tag: senderName }],
          attachment: await getStreamsFromAttachment(
            event.attachments.filter(item => mediaTypes.includes(item.type))
          )
        };

        api.sendMessage(formMessage, threadID, (err, info) => {
          if (err) return message.err(err);
          message.reply(getLang("replyUserSuccess"));
          global.GoatBot.onReply.set(info.messageID, {
            commandName,
            messageID: info.messageID,
            messageIDSender: event.messageID,
            threadID: event.threadID,
            type: "adminReply"
          });
        }, messageIDSender);
        break;
      }

      case "adminReply": {
        let sendByGroup = "";
        if (isGroup) {
          const { threadName } = await api.getThreadInfo(event.threadID);
          sendByGroup = getLang("sendByGroup", threadName, event.threadID);
        }

        const formMessage = {
          body: getLang("feedback", senderName, event.senderID, sendByGroup, args.join(" ")),
          mentions: [{ id: event.senderID, tag: senderName }],
          attachment: await getStreamsFromAttachment(
            event.attachments.filter(item => mediaTypes.includes(item.type))
          )
        };

        api.sendMessage(formMessage, threadID, (err, info) => {
          if (err) return message.err(err);
          message.reply(getLang("replySuccess"));
          global.GoatBot.onReply.set(info.messageID, {
            commandName,
            messageID: info.messageID,
            messageIDSender: event.messageID,
            threadID: event.threadID,
            type: "userCallAdmin"
          });
        }, messageIDSender);
        break;
      }

      default:
        break;
    }
  }
};
