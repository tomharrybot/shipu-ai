const { getPrefix } = global.utils;
const { commands, aliases } = global.GoatBot;

module.exports = {
  config: {
    name: "menu",
    version: "1.19",
    author: "Chitron Bhattacharjee",
    countDown: 5,
    role: 0,
    shortDescription: { en: "View command usage and list" },
    longDescription: { en: "Cute styled command list with pagination" },
    category: "info",
    guide: { en: "{pn} [page|all] | {pn} <cmdName>" },
    priority: 1
  },

  /** PREFIX VERSION */
  onStart: async function ({ message, args, event, threadsData, role }) {
    return handleHelp({ message, args, event, threadsData, role });
  },

  /** NO-PREFIX VERSION (onChat) */
  onChat: async function ({ event, message, threadsData, role }) {
    const match = event.body?.trim().match(/^help(?:\s+(all|\d+))?$/i);
    if (!match) return;
    const argArr = match[1] ? [match[1]] : [];
    return handleHelp({ message, args: argArr, event, threadsData, role });
  }
};

/* -------------------- CORE -------------------- */
async function handleHelp({ message, args, event, threadsData, role }) {
  const { threadID } = event;
  const prefix = getPrefix(threadID);

  /* ---------- LIST MODE ---------- */
  if (
    args.length === 0 ||
    (args.length === 1 && (/^\d+$/.test(args[0]) || /^all$/i.test(args[0])))
  ) {
    const pageSize = 15;

    /* collect cmds user may run */
    const allCmds = [...commands.entries()]
      .filter(([_, v]) => !(v.config.role > 1 && role < v.config.role))
      .map(([name]) => name)
      .sort();

    const totalPages = Math.ceil(allCmds.length / pageSize);
    const wantAll = /^all$/i.test(args[0]);
    const page = wantAll ? 1 : Math.max(1, Math.min(Number(args[0] || 1), totalPages));
    const slice = wantAll ? allCmds : allCmds.slice((page - 1) * pageSize, page * pageSize);

    /* header */
    let msg =
      `♡   ∩_∩\n` +
      `  („• ֊ •„)♡\n` +
      `╔═∪∪═════════╗\n` +
      ` ♡ ${wantAll ? "𝙰𝙻𝙻 𝙲𝙾𝙼𝙼𝙰𝙽𝙳'𝚂" : "𝙲𝙾𝙼𝙼𝙰𝙽𝙳 𝙻𝙸𝚂𝚃"} ♡\n` +
      `╚════════════╝\n\n`;

    slice.forEach(n => (msg += `⊂⊃ ➠ ${n}\n`));

    /* minimal event list */
    msg += `\n𝙴𝚅𝙴𝙽𝚃 𝙻𝙸𝚂𝚃:\n\n⊂⊃ ➠ 𝗅𝖾𝖺𝗏𝖾\n⊂⊃ ➠ 𝗐𝖾𝗅𝖼𝗈𝗆𝖾𝗇𝗈𝗍𝗂\n`;

    if (!wantAll) msg += `\n𝗣𝗮𝗴𝗲:〔 ${page}/${totalPages} 〕\n`;
    msg += `𝗧𝗼𝘁𝗮𝗹 𝗰𝗼𝗺𝗺𝗮𝗻𝗱𝘀:〔 ${allCmds.length} 〕\n`;
    msg += `𝖳𝗒𝗉𝖾 "${prefix}𝗁𝖾𝗅𝗉 𝖺𝗅𝗅" 𝗍𝗈 𝗌𝖾𝖾 𝖺𝗅𝗅 𝖼𝗈𝗆𝗆𝖺𝗇𝖽𝗌.\n`;

    return message.reply({ body: msg });
  }

  /* ---------- DETAIL MODE ---------- */
  const cmdName = args[0].toLowerCase();
  const cmd = commands.get(cmdName) || commands.get(aliases.get(cmdName));
  if (!cmd) return message.reply(`❌ Command "${cmdName}" not found.`);

  const cfg = cmd.config;
  const usage = (cfg.guide?.en || "")
    .replace(/{p}/g, prefix)
    .replace(/{n}/g, cfg.name);

  const detail =
    `╭─💖 𝙲𝙾𝙼𝙼𝙰𝙽𝙳 𝙸𝙽𝙵𝙾─⭓\n` +
    `│ 🌸 Name: ${cfg.name}\n` +
    `│ 🌈 Aliases: ${cfg.aliases?.join(", ") || "None"}\n` +
    `│ 📖 Description: ${cfg.longDescription?.en || "No description."}\n` +
    `│ 👤 Author: Chitron Bhattacharjee\n` +
    `│ 🔧 Version: ${cfg.version}\n` +
    `│ 🛡 Role: ${roleToStr(cfg.role)}\n` +
    `│ ⏱ Cooldown: ${cfg.countDown}s\n` +
    `├── 💡 𝚄𝚂𝙰𝙶𝙴\n` +
    `│ ${usage || "No guide."}\n` +
    `╰━━━━━━━━━━━━━━❖`;

  return message.reply({ body: detail });
}

/* util */
function roleToStr(r) {
  return r === 0 ? "0 (All users)"
       : r === 1 ? "1 (Group admins)"
       : r === 2 ? "2 (Bot admin)"
       : "Unknown";
}
