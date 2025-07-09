const symbols = [
  { emoji: "🍒" }, { emoji: "🍋" }, { emoji: "💎" },
  { emoji: "🔔" }, { emoji: "7️⃣" }, { emoji: "🍇" },
  { emoji: "🍉" }, { emoji: "🥝" }, { emoji: "🍍" }
];

const configSlot = {
  cooldown: 3,
  maxAutoSpin: 10,
  defaultBet: 1000
};

module.exports = {
  config: {
    name: "slot",
    version: "3.0",
    author: "Chitron Bhattacharjee",
    countDown: configSlot.cooldown,
    role: 0,
    shortDescription: { en: "🎰 Casino-style slot game" },
    longDescription: { en: "Play weighted slot machine with high loss, low win like real casino!" },
    category: "𝗙𝗨𝗡 & 𝗚𝗔𝗠𝗘",
    guide: {
      en: "slot [amount]\nslot auto -5 [amount]"
    }
  },

  langs: {
    en: {
      invalid_amount: "Enter a valid and positive amount.",
      not_enough_money: "You don't have enough coins.",
      spinning: "🎰 SPINNING...",
      win: "🧧 You won %1 coins!",
      lose: "💀 You lost %1 coins.",
      auto_done: "✅ Auto spin completed."
    }
  },

  onStart: async function ({ args, message, event, usersData, getLang }) {
    return await handleSlot({ args, message, event, usersData, getLang });
  },

  onChat: async function ({ event, message, usersData, getLang }) {
    const text = event.body.toLowerCase().trim();
    if (!text.startsWith("slot")) return;
    const args = text.split(/\s+/).slice(1);
    return await handleSlot({ args, message, event, usersData, getLang });
  }
};

// ===============================

async function handleSlot({ args, message, event, usersData, getLang }) {
  const { senderID } = event;
  const user = await usersData.get(senderID);

  let isAuto = args[0]?.toLowerCase() === "auto";
  let spins = 1;
  let bet = configSlot.defaultBet;

  if (isAuto) {
    spins = parseInt(args[1]?.replace("-", "")) || 1;
    spins = Math.min(spins, configSlot.maxAutoSpin);
    bet = parseInt(args[2]) || configSlot.defaultBet;
  } else {
    bet = parseInt(args[0]) || configSlot.defaultBet;
  }

  if (isNaN(bet) || bet <= 0)
    return message.reply(getLang("invalid_amount"));
  if (user.money < bet * spins)
    return message.reply(getLang("not_enough_money"));

  await message.reply(getLang("spinning"));

  setTimeout(async () => {
    let fullResult = "";
    let totalWinnings = 0;

    for (let i = 0; i < spins; i++) {
      const grid = generateGrid(3);
      const winnings = calculateBestMatchReward(grid, bet);
      totalWinnings += winnings;
      fullResult += buildFormattedResult(grid, winnings);
    }

    await usersData.set(senderID, {
      money: user.money + totalWinnings,
      data: user.data
    });

    fullResult += isAuto ? `\n${getLang("auto_done")}` : "";
    message.reply(fullResult.trim());
  }, 1000);
}

// ===============================

function generateGrid(rows) {
  const grid = [];
  for (let i = 0; i < rows; i++) {
    grid.push(generateWeightedRow());
  }
  return grid;
}

function generateWeightedRow() {
  const roll = Math.random() * 100;

  if (roll <= 3) return generate3Match();
  else if (roll <= 15) return generate2Match();
  else return generateNoMatch();
}

function generate3Match() {
  const pick = randomEmoji();
  return [pick, pick, pick];
}

function generate2Match() {
  const pick1 = randomEmoji();
  let pick2;
  do {
    pick2 = randomEmoji();
  } while (pick2.emoji === pick1.emoji);

  const positions = shuffle([0, 1, 2]);
  const row = [];
  row[positions[0]] = pick1;
  row[positions[1]] = pick1;
  row[positions[2]] = pick2;
  return row;
}

function generateNoMatch() {
  return shuffle([...symbols]).slice(0, 3);
}

function randomEmoji() {
  return symbols[Math.floor(Math.random() * symbols.length)];
}

function shuffle(arr) {
  return arr.sort(() => Math.random() - 0.5);
}

function calculateBestMatchReward(grid, bet) {
  let bestReward = -bet;

  for (const row of grid) {
    const [a, b, c] = row;

    if (a.emoji === b.emoji && b.emoji === c.emoji) {
      const bonus = randPercent(80, 120);
      const reward = Math.floor(bet + (bet * bonus / 100));
      bestReward = Math.max(bestReward, reward);
    }

    else if (a.emoji === b.emoji || b.emoji === c.emoji || a.emoji === c.emoji) {
      const bonus = randPercent(10, 25);
      const reward = Math.floor(bet + (bet * bonus / 100));
      bestReward = Math.max(bestReward, reward);
    }
  }

  return bestReward;
}

function randPercent(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function buildFormattedResult(grid, winnings) {
  const border = "━━━━━━━━━━━━━━";
  const rows = grid.map(row => `| ${row.map(s => s.emoji).join(" | ")} |`).join("\n");

  let msg = `\n${border}\n${rows}\n${border}\n`;
  if (winnings > 0) {
    msg += `🧧 You won ${winnings} coins!\n`;
  } else {
    msg += `💀 You lost ${-winnings} coins.\n`;
  }
  return msg;
}
