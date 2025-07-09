module.exports = {
  config: {
    name: "tagall",
    version: "2.2",
    author: "Chitron Bhattacharjee",
    role: 0,
    shortDescription: {
      en: "🌸 Kawaii style mention all"
    },
    longDescription: {
      en: "Mentions all members in the group with cute, floral Unicode styling"
    },
    category: "group",
    guide: {
      en: "+tagall or just type 'tag all' in group"
    }
  },

  onStart: async function () {}, // dummy install support

  onChat: async function ({ event, message, api }) {
    const triggers = [
      "tag all",
      "everyone",
      "mention all",
      "সবার নাম বল",
      "tagall"
    ];
    const body = event.body?.toLowerCase();
    if (!body || !triggers.some(t => body.startsWith(t))) return;

    try {
      const threadInfo = await api.getThreadInfo(event.threadID);
      const allMembers = threadInfo.participantIDs;
      const BATCH_SIZE = 20;
      let index = 0;

      for (let i = 0; i < allMembers.length; i += BATCH_SIZE) {
        const batch = allMembers.slice(i, i + BATCH_SIZE);

        let msg = `╭─── ⋆⋅☆⋅⋆ ───╮\n`;
        msg += `🌸 𝒦𝒶𝓌𝒶𝒾𝒾 𝒯𝒶𝑔 𝒯𝒾𝓂𝑒 🌸\n`;
        msg += `╰─── ⋆⋅☆⋅⋆ ───╯\n\n`;

        let mentions = [];

        for (let j = 0; j < batch.length; j++) {
          const userID = batch[j];
          const name = threadInfo.userInfo.find(u => u.id === userID)?.name || "🌼 𝑀𝑒𝓂𝒷𝑒𝓇";
          msg += `🌺 𝟘${(index + 1).toString().padStart(2, "0")}. ${toKawaii(name)}\n`;
          mentions.push({ id: userID, tag: name });
          index++;
        }

        msg += `\n🌟 𝒯𝑜𝓉𝒶𝓁: ${index} 𝓂𝑒𝓂𝒷𝑒𝓇𝓈 𝓉𝒶𝑔𝑔𝑒𝒹 🌟`;

        await api.sendMessage({ body: msg, mentions }, event.threadID);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      api.sendMessage("💖 𝒜𝓁𝓁 𝓂𝑒𝓂𝒷𝑒𝓇𝓈 𝓉𝒶𝑔𝑔𝑒𝒹 𝓌𝒾𝓉𝒽 𝓁💗𝓋𝑒!~", event.threadID);
    } catch (err) {
      console.error(err);
      api.sendMessage("❌ 𝒪𝓊𝒸𝒽~ 𝒮𝑜𝓂𝑒𝓉𝒽𝒾𝓃𝑔 𝓌𝑒𝓃𝓉 𝓌𝓇𝑜𝓃𝑔!", event.threadID);
    }
  }
};

// Helper function to convert to kawaii font
function toKawaii(str) {
  const normal = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const fancy = [
    "𝒶","𝒷","𝒸","𝒹","𝑒","𝒻","𝑔","𝒽","𝒾","𝒿","𝓀","𝓁","𝓂","𝓃","𝑜","𝓅","𝓆","𝓇","𝓈","𝓉","𝓊","𝓋","𝓌","𝓍","𝓎","𝓏",
    "𝒜","𝐵","𝒞","𝒟","𝐸","𝐹","𝒢","𝐻","𝐼","𝒥","𝒦","𝐿","𝑀","𝒩","𝒪","𝒫","𝒬","𝑅","𝒮","𝒯","𝒰","𝒱","𝒲","𝒳","𝒴","𝒵",
    "𝟢","𝟣","𝟤","𝟥","𝟦","𝟧","𝟨","𝟩","𝟪","𝟫"
  ];

  return str
    .split("")
    .map(ch => {
      const idx = normal.indexOf(ch);
      return idx !== -1 ? fancy[idx] : ch;
    })
    .join("");
}
