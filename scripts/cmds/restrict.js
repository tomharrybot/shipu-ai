const { findUid } = global.utils;
const moment = require("moment-timezone");

module.exports = {
  config: {
    name: "res",
    version: "1.0",
    author: "Chitron Bhattacharjee",
    countDown: 5,
    role: 1,
    description: {
      en: "Temporarily restrict a user in group chat"
    },
    category: "𝗕𝗢𝗫",
    guide: {
      en:
        "{pn} res [@tag|uid|reply] <time_in_minutes>: Restrict user for specified minutes\n" +
        "{pn} res unrestrict [@tag|uid|reply]: Remove restriction\n" +
        "{pn} res check: Check restricted users"
    }
  },

  langs: {
    en: {
      noTarget: "⚠️ Please tag, reply or provide uid of user to restrict.",
      noTime: "⚠️ Please specify restriction time in minutes.",
      cantSelf: "⚠️ You can't restrict yourself!",
      cantRestrictAdmin: "❌ You can't restrict an admin!",
      alreadyRestricted: "❌ User is already restricted!",
      restrictedSuccess: "✅ Successfully restricted %1 for %2 minute(s)! ⏳",
      notRestricted: "⚠️ User %1 is not restricted!",
      unrestrictedSuccess: "✅ Removed restriction from %1! 🎉",
      listRestricted: "📑 Restricted users in this chat (page %1/%2):\n%3",
      noRestrictedUsers: "📑 No users are currently restricted.",
      invalidCommand: "⚠️ Invalid command or missing parameters.",
      restrictCheckHeader: "⏳ List of currently restricted users:\n",
      restrictTimeFormat: "%1 minute(s)",
      userInfoLine: "%1. %2 (UID: %3) - Time left: %4\n",
      timeExpired: "Expired"
    }
  },

  onStart: async function ({ message, event, args, threadsData, getLang, usersData, api }) {
    const { members, adminIDs } = await threadsData.get(event.threadID);
    const senderID = event.senderID;
    let target, timeArg;

    // Key for restricted users data in threadsData
    const restrictedKey = "data.restricted_users";
    let restrictedUsers = await threadsData.get(event.threadID, restrictedKey, []);

    if (!args.length) return message.reply(getLang("invalidCommand"));

    if (args[0].toLowerCase() === "check") {
      if (!restrictedUsers.length) return message.reply(getLang("noRestrictedUsers"));

      const now = Date.now();
      const limit = 20;
      const page = parseInt(args[1]) || 1;
      const start = (page - 1) * limit;
      const end = page * limit;
      const sliced = restrictedUsers.slice(start, end);

      let msg = "";
      let count = 0;

      for (const item of sliced) {
        count++;
        const name = members[item.id]?.name || (await usersData.getName(item.id)) || "Facebook user";
        let timeLeftMs = item.restrictUntil - now;
        let timeLeftMin = timeLeftMs > 0 ? Math.ceil(timeLeftMs / 60000) : 0;
        const timeLeftStr = timeLeftMin > 0 ? getLang("restrictTimeFormat", timeLeftMin) : getLang("timeExpired");
        msg += getLang("userInfoLine", start + count, name, item.id, timeLeftStr);
      }

      return message.reply(getLang("listRestricted", page, Math.ceil(restrictedUsers.length / limit), msg));
    }

    // Unrestrict command
    if (args[0].toLowerCase() === "unrestrict") {
      if (Object.keys(event.mentions || {}).length) target = Object.keys(event.mentions)[0];
      else if (event.messageReply?.senderID) target = event.messageReply.senderID;
      else if (!isNaN(args[1])) target = args[1];
      else return message.reply(getLang("noTarget"));

      const index = restrictedUsers.findIndex(u => u.id == target);
      if (index === -1) return message.reply(getLang("notRestricted", target));

      restrictedUsers.splice(index, 1);
      await threadsData.set(event.threadID, restrictedUsers, restrictedKey);

      const name = members[target]?.name || (await usersData.getName(target)) || "Facebook user";
      return message.reply(getLang("unrestrictedSuccess", name));
    }

    // Restrict command
    if (Object.keys(event.mentions || {}).length) {
      target = Object.keys(event.mentions)[0];
      timeArg = args.slice(1).join(" ");
    } else if (event.messageReply?.senderID) {
      target = event.messageReply.senderID;
      timeArg = args.join(" ");
    } else if (!isNaN(args[0])) {
      target = args[0];
      timeArg = args.slice(1).join(" ");
    } else {
      return message.reply(getLang("noTarget"));
    }

    if (!timeArg) return message.reply(getLang("noTime"));

    const restrictMinutes = parseInt(timeArg);
    if (isNaN(restrictMinutes) || restrictMinutes <= 0)
      return message.reply(getLang("noTime"));

    if (target == senderID) return message.reply(getLang("cantSelf"));
    if (adminIDs.includes(target)) return message.reply(getLang("cantRestrictAdmin"));

    if (restrictedUsers.find(u => u.id == target)) return message.reply(getLang("alreadyRestricted"));

    const now = Date.now();
    const restrictUntil = now + restrictMinutes * 60000;

    restrictedUsers.push({
      id: target,
      restrictUntil
    });
    await threadsData.set(event.threadID, restrictedUsers, restrictedKey);

    const name = members[target]?.name || (await usersData.getName(target)) || "Facebook user";
    message.reply(getLang("restrictedSuccess", name, restrictMinutes));
  },

  onEvent: async function ({ event, api, threadsData, getLang, message }) {
    if (event.logMessageType == "log:subscribe") {
      const { threadID } = event;
      const restrictedKey = "data.restricted_users";
      let restrictedUsers = await threadsData.get(threadID, restrictedKey, []);
      const usersAdded = event.logMessageData.addedParticipants;
      const now = Date.now();

      for (const user of usersAdded) {
        const restricted = restrictedUsers.find(u => u.id == user.userFbId);
        if (restricted) {
          if (restricted.restrictUntil > now) {
            // User still restricted, remove from group
            return api.removeUserFromGroup(user.userFbId, threadID, err => {
              if (err)
                return message.send(
                  getLang(
                    "needAdminToKick",
                    user.fullName,
                    user.userFbId
                  )
                );
              else
                return message.send(
                  `${user.fullName} is temporarily restricted and was removed from the group.`
                );
            });
          } else {
            // Restriction expired - clean up
            restrictedUsers = restrictedUsers.filter(u => u.id != user.userFbId);
            await threadsData.set(threadID, restrictedUsers, restrictedKey);
          }
        }
      }
    }
  }
};
