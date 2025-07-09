const fs = require("fs-extra");
const path = require("path");
const Canvas = require("canvas");

const gameImageURL = "https://i.imgur.com/TQCpxrZ.jpeg";
const chakraMoves = [
  "𝘊𝘩𝘢𝘬𝘳𝘢 𝘗𝘶𝘭𝘴𝘦 🌀",
  "𝘓𝘪𝘨𝘩𝘵𝘯𝘪𝘯𝘨 𝘉𝘭𝘪𝘵𝘻 ⚡",
  "𝘍𝘪𝘳𝘦 𝘛𝘰𝘳𝘯𝘢𝘥𝘰 🔥🔥",
  "𝘚𝘩𝘢𝘥𝘰𝘸 𝘍𝘢𝘯𝘨 💨",
  "𝘔𝘺𝘴𝘵𝘪𝘤 𝘉𝘭𝘢𝘥𝘦 ✨",
  "𝘙𝘢𝘴𝘦𝘯𝘨𝘢𝘯 𝘚𝘵𝘰𝘳𝘮 💫"
];
const attackWords = ["kick", "slap", "punch", "atk"];

module.exports = {
  config: {
    name: "pbg",
    version: "7.0",
    author: "Chitron Bhattacharjee",
    countDown: 5,
    role: 0,
    shortDescription: { en: "Power Boxing vs bot" },
    description: { en: "Fight game with Chakra combo system" },
    category: "games",
    guide: { en: "+pbg [amount]" }
  },

  onStart: async () => {},

  onChat: async function ({ event, message, usersData }) {
    const content = event.body?.trim().toLowerCase();
    if (!content) return;

    const senderID = event.senderID;
    const threadID = event.threadID;

    // Start game command: +pbg [amount]
    const matchStart = content.match(/^(\+?pbg)[\s\-:]?(\d{1,10})$/i);
    if (matchStart) {
      const bet = parseInt(matchStart[2]);
      if (isNaN(bet) || bet <= 0) return message.reply("❌ Enter valid bet amount");

      const user = await usersData.get(senderID);
      if (user.money < bet) return message.reply("💸 Not enough balance!");

      const imgPath = path.join(__dirname, "cache", "pbg.jpg");
      if (!fs.existsSync(imgPath)) {
        const https = require("https");
        await fs.ensureDir(path.dirname(imgPath));
        const file = fs.createWriteStream(imgPath);
        await new Promise((resolve) =>
          https.get(gameImageURL, (res) => {
            res.pipe(file);
            file.on("finish", resolve);
          })
        );
      }

      const game = {
        stage: "fighting",
        bet,
        player: { name: "Kakashi (DMS)", hp: 300, chakra: 100 },
        bot: { name: "Nagato", hp: 300, chakra: 100 },
        playerId: senderID,
        threadID,
        round: 0,
        penaltyApplied: false
      };

      global.pbgGames = global.pbgGames || {};
      const msg = await message.reply({
        body: "🥊 𝗣𝗼𝘄𝗲𝗿 𝗕𝗼𝘅𝗶𝗻𝗴 𝗚𝗮𝗺𝗲 🥊\n💥 Opponent: Nagato\n⏳ Starting in 3...",
        attachment: fs.createReadStream(imgPath)
      });

      game.messageID = msg.messageID;
      global.pbgGames[msg.messageID] = game;

      // Countdown messages with unsend
      const countMsgs = [];
      for (let i = 2; i >= 1; i--) {
        await new Promise((r) => setTimeout(r, 1000));
        const m = await message.reply(`⏳ Starting in ${i}...`);
        countMsgs.push(m.messageID);
      }

      await new Promise((r) => setTimeout(r, 1000));
      const m = await message.reply("🚀 Fight Started!\n✏️ Type: kick, slap, punch, atk");
      countMsgs.push(m.messageID);

      for (const mid of countMsgs) {
        try {
          await message.unsend(mid);
        } catch {}
      }

      return;
    }

    // Fight handling
    if (!global.pbgGames) return;

    const gameEntry = Object.entries(global.pbgGames).find(([_, g]) =>
      g.threadID === threadID && g.playerId === senderID && g.stage === "fighting"
    );
    if (!gameEntry) return;

    const [msgID, game] = gameEntry;
    const user = await usersData.get(senderID);

    if (!attackWords.includes(content)) return;

    game.round++;

    // Player combo damage
    const combo = getCombo();
    const totalDmg = combo.reduce((a, b) => a + b.dmg, 0);

    // Bot damage balanced close to player damage ±2
    const botMin = Math.max(4, totalDmg - 2);
    const botMax = totalDmg + 2;
    let botHit = getRand(botMin, botMax);

    // Bot surprise critical hit (15% chance)
    const criticalChance = 15; // percent
    if (getRand(1, 100) <= criticalChance) {
      const critBonus = getRand(10, 20); // extra damage
      botHit += critBonus;
      await message.reply("😈 Nagato lands a CRITICAL HIT! Extra damage!");
    }

    // Apply damages & chakra costs
    game.bot.hp = Math.max(0, game.bot.hp - totalDmg);
    game.player.chakra = Math.max(0, game.player.chakra - getRand(5, 10));

    if (game.player.chakra < 30 && !game.penaltyApplied) {
      game.player.chakra += 15;
      game.penaltyApplied = true;
      await usersData.set(senderID, { money: user.money - 20 }, true);
      await message.reply("⚠️ Chakra Low! -20 coins for energy booster.");
    }

    if (game.player.chakra <= 0) {
      await message.reply("⚠️ No chakra left! Skip turn to meditate.");
      return;
    }

    game.player.hp = Math.max(0, game.player.hp - botHit);
    game.bot.chakra = Math.max(0, game.bot.chakra - getRand(5, 10));

    const comboText = combo.map(m => `✨ ${m.name}\n💥 𝗗𝗮𝗺𝗮𝗴𝗲: ${m.dmg}%`).join("\n");
    const botMove = chakraMoves[Math.floor(Math.random() * chakraMoves.length)];
    const fightLog = `⚔️ 𝗖𝗼𝗺𝗯𝗼 𝗔𝘁𝘁𝗮𝗰𝗸:\n${comboText}\n\n😈 𝗡𝗮𝗴𝗮𝘁𝗼 uses ${botMove}\n💢 𝗗𝗲𝗮𝗹𝘁 ${botHit}% to 𝗞𝗮𝗸𝗮𝘀𝗵𝗶\n\n${renderStatus(game)}`;

    // End game immediately if HP zero or below
    if (game.bot.hp <= 0 || game.player.hp <= 0) {
      delete global.pbgGames[msgID];
      game.stage = "finished";

      if (game.player.hp <= 0 && game.bot.hp <= 0) {
        await message.reply(fightLog + `\n\n⚔️ It's a tie! No coins lost.`);
        return;
      }
      if (game.player.hp > 0 && game.bot.hp <= 0) {
        const reward = game.bet * 4;
        await usersData.set(senderID, { money: user.money + reward }, true);
        const winImg = await createWinnerCanvas(game.player.name, game.bot.name, reward);
        return message.reply({
          body: fightLog + `\n\n🏆 𝗬𝗼𝘂 𝗪𝗜𝗡! +${reward} coins 💰`,
          attachment: fs.createReadStream(winImg)
        });
      }
      if (game.player.hp <= 0 && game.bot.hp > 0) {
        await usersData.set(senderID, { money: user.money - game.bet }, true);
        return message.reply(fightLog + `\n\n❌ 𝗬𝗼𝘂 𝗟𝗼𝘀𝘁! -${game.bet} coins`);
      }
    }

    // Continue fight
    return message.reply(fightLog + "\n\n✏️ Keep going: type kick/slap/punch/atk!");
  }
};

function renderStatus(game) {
  return (
    "━━━━━━━━━━━━━━\n" +
    `💛| ${game.player.name}: 𝗛𝗣 ${game.player.hp}%\n` +
    `💙| 𝗖𝗵𝗮𝗸𝗿𝗮 ${game.player.chakra}%\n` +
    "━━━━━━━━━━━━━━\n" +
    `💛| ${game.bot.name}: 𝗛𝗣 ${game.bot.hp}%\n` +
    `💙| 𝗖𝗵𝗮𝗸𝗿𝗮 ${game.bot.chakra}%\n` +
    "━━━━━━━━━━━━━━"
  );
}

function getCombo() {
  const moves = [];
  const used = new Set();
  const count = getRand(2, 3);
  while (moves.length < count) {
    const move = chakraMoves[Math.floor(Math.random() * chakraMoves.length)];
    if (!used.has(move)) {
      used.add(move);
      moves.push({ name: move, dmg: getRand(5, 15) });
    }
  }
  return moves;
}

function getRand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function createWinnerCanvas(playerName, botName, reward) {
  const width = 700, height = 500;
  const canvas = Canvas.createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#0d0d0d";
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "#00ff99";
  ctx.font = "40px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("🏆 𝗣𝗼𝘄𝗲𝗿 𝗕𝗼𝘅𝗶𝗻𝗴 𝗖𝗵𝗮𝗺𝗽𝗶𝗼𝗻!", width / 2, 60);

  ctx.fillStyle = "#ffffff";
  ctx.font = "26px sans-serif";
  ctx.fillText(`${playerName} defeated ${botName}!`, width / 2, 160);

  ctx.fillStyle = "#ffd700";
  ctx.fillText(`+${reward} Coins Earned 💰`, width / 2, 220);

  ctx.fillStyle = "#aaaaaa";
  ctx.font = "20px sans-serif";
  ctx.fillText("“Your Chakra Control is Unmatched.”", width / 2, 400);

  const outPath = path.join(__dirname, "cache", `pbg_win_${Date.now()}.jpg`);
  await fs.ensureDir(path.dirname(outPath));
  const buffer = canvas.toBuffer("image/jpeg");
  fs.writeFileSync(outPath, buffer);
  return outPath;
             }
