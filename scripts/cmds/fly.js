const { getStreamFromURL } = global.utils;
const suffixes = { k: 1e3, m: 1e6, b: 1e9, t: 1e12, q: 1e15 };

module.exports = {
  config: {
    name: "fly",
    version: "1.0",
    author: "Chitron Bhattacharjee",
    role: 0,
    shortDescription: { en: "Fly and bet money!" },
    longDescription: { en: "Bet and win or lose with fly command" },
    category: "economy",
    guide: { en: "fly 1k / fly 5m / fly 2b etc" }
  },

  onChat: async function ({ message, event, usersData }) {
    const match = event.body?.toLowerCase()?.match(/^fly\s+(\d+(?:\.\d+)?)([kmbtq]?)$/);
    if (!match) return;

    const uid = event.senderID;
    const num = parseFloat(match[1]);
    const suffix = match[2];
    const multiplier = suffixes[suffix] || 1;
    const bet = Math.floor(num * multiplier);

    if (isNaN(bet) || bet <= 0) return message.reply("❌ Invalid bet amount.");

    const user = await usersData.get(uid);
    const currentBal = user.money || 0;

    if (currentBal < bet) return message.reply(`❌ Not enough balance. You have $${formatMoney(currentBal)}.`);

    const win = Math.random() < 0.5; // 50% chance
    const multiplierWin = (Math.random() * 1.3 + 1.2).toFixed(2); // 1.2x – 2.5x

    let newBalance, resultText;
    if (win) {
      const winnings = Math.floor(bet * multiplierWin);
      newBalance = currentBal + (winnings - bet);
      resultText = `╭─────🌻🤍\n│\n│     𝙔𝙤𝙪 𝙒𝙤𝙣!❤️‍🔥\n│\n│     𝙈𝙪𝙡𝙩𝙞𝙥𝙡𝙞𝙚𝙧: ${multiplierWin}×\n│     𝙒𝙞𝙣𝙣𝙞𝙣𝙜𝙨: $${formatMoney(winnings)}\n│     𝘽𝙖𝙡𝙖𝙣𝙘𝙚: $${formatMoney(newBalance)}\n│\n│     𝘽 𝙀 𝙏\n╰─────🌻🤍`;
    } else {
      newBalance = currentBal - bet;
      resultText = `╭─────🌻🤍\n│\n│     𝙔𝙤𝙪 𝙇𝙤𝙨𝙩💔\n│\n│     𝙇𝙤𝙨𝙩: $${formatMoney(bet)}\n│     𝘽𝙖𝙡𝙖𝙣𝙘𝙚: $${formatMoney(newBalance)}\n│\n│     𝘽 𝙀 𝙏\n╰─────🌻🤍`;
    }

    await usersData.set(uid, { money: newBalance });
    return message.reply(resultText);
  },

  onStart: async function () {
    // Dummy onStart for install compatibility
  }
};

function formatMoney(amount) {
  const abs = Math.abs(amount);
  if (abs >= 1e15) return (amount / 1e15).toFixed(2) + "Q";
  if (abs >= 1e12) return (amount / 1e12).toFixed(2) + "T";
  if (abs >= 1e9) return (amount / 1e9).toFixed(2) + "B";
  if (abs >= 1e6) return (amount / 1e6).toFixed(2) + "M";
  if (abs >= 1e3) return (amount / 1e3).toFixed(2) + "K";
  return amount.toString();
}