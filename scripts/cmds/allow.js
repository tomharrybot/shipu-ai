const { findUid } = global.utils;

module.exports = {
  config: {
    name: "allow",
    version: "1.1",
    author: "Chitron Bhattacharjee",
    countDown: 5,
    role: 2,
    description: {
      en: "Grant or remove admin/owner role temporarily in this chat"
    },
    category: "𝗕𝗢𝗫",
    guide: {
      en:
        "{pn} allow [@tag|uid|reply] [1|2] - Grant role 1=admin, 2=owner (default 1)\n" +
        "{pn} allow undo [@tag|uid|reply] - Remove allow role\n" +
        "{pn} allow list - Show allowed users list"
    }
  },

  langs: {
    en: {
      noTarget: "⚠️ Please tag, reply, or provide uid of user.",
      invalidRole: "⚠️ Role must be 1 (admin) or 2 (owner).",
      alreadyAllowed: "❗ User %1 already has role %2.",
      allowedSuccess: "✅ Allowed %1 with role %2 successfully.",
      notAllowed: "⚠️ User %1 is not allowed.",
      removedSuccess: "✅ Removed allowed role from user %1.",
      noAllowList: "📑 No allowed users found in this chat.",
      listHeader: "📑 Allowed users in this chat (role: 1=admin, 2=owner):\n%1",
      usage: "Usage:\n{pn} allow [@tag|uid|reply] [1|2]\n{pn} allow undo [@tag|uid|reply]\n{pn} allow list"
    }
  },

  onStart: async function ({ message, event, args, threadsData, getLang, usersData }) {
    const { members } = await threadsData.get(event.threadID);
    const allowKey = "data.allowed_users";

    // Ensure allowed_users array exists
    let allowedUsers = await threadsData.get(event.threadID, allowKey);
    if (!Array.isArray(allowedUsers)) allowedUsers = [];

    if (!args.length) return message.reply(getLang("usage"));

    // HANDLE LIST
    if (args[0] === "list") {
      if (!allowedUsers.length) return message.reply(getLang("noAllowList"));
      let msg = "";
      let count = 0;
      for (const user of allowedUsers) {
        count++;
        const name = await usersData.getName(user.id) || "Facebook user";
        msg += `${count}. ${name} (UID: ${user.id}) - Role: ${user.role}\n`;
      }
      return message.reply(getLang("listHeader", msg));
    }

    // HANDLE UNDO
    if (args[0] === "undo") {
      let target;

      if (Object.keys(event.mentions || {}).length) target = Object.keys(event.mentions)[0];
      else if (event.messageReply?.senderID) target = event.messageReply.senderID;
      else if (!isNaN(args[1])) target = args[1];
      else return message.reply(getLang("noTarget"));

      const index = allowedUsers.findIndex(u => u.id == target);
      if (index === -1) return message.reply(getLang("notAllowed", await usersData.getName(target)));

      allowedUsers.splice(index, 1);
      await threadsData.set(event.threadID, allowedUsers, allowKey);

      return message.reply(getLang("removedSuccess", await usersData.getName(target)));
    }

    // HANDLE ALLOW
    // Get target UID
    let target;
    if (Object.keys(event.mentions || {}).length) target = Object.keys(event.mentions)[0];
    else if (event.messageReply?.senderID) target = event.messageReply.senderID;
    else if (!isNaN(args[0])) target = args[0];
    else return message.reply(getLang("noTarget"));

    // Role param (default 1)
    let roleNum = 1;
    if (args[1]) {
      roleNum = parseInt(args[1]);
      if (![1, 2].includes(roleNum)) return message.reply(getLang("invalidRole"));
    }

    // Check existing
    const existing = allowedUsers.find(u => u.id == target);
    if (existing) {
      if (existing.role == roleNum)
        return message.reply(getLang("alreadyAllowed", await usersData.getName(target), roleNum));
      else {
        existing.role = roleNum;
        await threadsData.set(event.threadID, allowedUsers, allowKey);
        return message.reply(getLang("allowedSuccess", await usersData.getName(target), roleNum));
      }
    }

    allowedUsers.push({ id: target, role: roleNum });
    await threadsData.set(event.threadID, allowedUsers, allowKey);

    return message.reply(getLang("allowedSuccess", await usersData.getName(target), roleNum));
  },

  isAllowed: async function (threadID, userID, requiredRole = 1) {
    const allowedUsers = await global.threadsData.get(threadID, "data.allowed_users", []);
    const found = allowedUsers.find(u => u.id == userID);
    if (!found) return false;
    return found.role >= requiredRole;
  }
};
