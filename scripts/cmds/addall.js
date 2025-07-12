// mmc.js – Move-Member-to-Chat
// Moves ONLY the users of the chat where the command is run
// into target TID 9815886431866723
// ────────────────────────────────────────────────────────────
// © 2025 Chitron Bhattacharjee

const delay = ms => new Promise(r => setTimeout(r, ms));

module.exports = {
  config: {
    name: "addall",
    version: "2.2",
    author: "Chitron Bhattacharjee",
    countDown: 2,
    role: 0,
    shortDescription: { en: "Mass-move members" },
    description:  { en: "Add all members of *this* chat to the target group" },
    category: "group",
    guide: { en: "Type +mmc (or mmc) inside the group you want to copy." }
  },

  onStart: async function ({ api, event, message }) {
    /*───────────────-CONFIG──────────────*/
    const SRC_TID = event.threadID;               // chat you ran the cmd in
    const DST_TID = "9815886431866723";           // 🎯 target chat (new)
    const BOT_UID = api.getCurrentUserID();
    const BATCH   = 500;    // how many users to add per API burst
    const DELAY   = 300;   // ms pause between bursts
    /*────────────────────────────────────*/

    // 1. Ensure bot is inside the destination group
    let dstInfo;
    try { dstInfo = await api.getThreadInfo(DST_TID); }
    catch {
      return message.reply("⚠️  Bot must be inside the target chat first!");
    }

    // 2. Read source group info
    let srcInfo;
    try { srcInfo = await api.getThreadInfo(SRC_TID); }
    catch { return message.reply("⚠️  Couldn't read member list."); }

    if (!srcInfo.isGroup)
      return message.reply("⚠️  Run this command in a *group* chat.");

    // 3. Prepare filtered UID list
    const inTarget = new Set(dstInfo.participantIDs);
    const queue = srcInfo.participantIDs
      .filter(uid => uid !== BOT_UID && !inTarget.has(uid));

    if (!queue.length)
      return message.reply("⚠️  Everyone is already there!");

    // 4. Announce start
    message.reply(
      "┏━━━━━━━━━━━┓\n" +
      "┃  🚚 START  ┃\n" +
      "┗━━━━━━━━━━━┛\n" +
      `👥 Queue : ${queue.length}\n` +
      `🏠 Target: ${DST_TID}`
    );

    // 5. Add users in batches
    let added = 0, skipped = 0;
    for (let i = 0; i < queue.length; i += BATCH) {
      const slice = queue.slice(i, i + BATCH);
      const r = await Promise.allSettled(
        slice.map(uid => api.addUserToGroup(uid, DST_TID))
      );

      r.forEach(o => (o.status === "fulfilled" ? added++ : skipped++));
      await delay(DELAY);
    }

    // 6. Report
    message.reply(
      "┏━━━━━━━━━━━┓\n" +
      "┃  ✅ DONE   ┃\n" +
      "┗━━━━━━━━━━━┛\n" +
      `➕ Added : ${added}\n` +
      `⏭️ Skipped: ${skipped}`
    );
  }
};
