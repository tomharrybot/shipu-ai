+cmd install spin.js const fs = require("fs-extra");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

module.exports = {
  config: {
    name: "spin",
    aliases: [],
    version: "3.0",
    author: "Chitron Bhattacharjee",
    countDown: 0,
    role: 0,
    shortDescription: "🎰 Anime spin to earn",
    longDescription: "Spin to earn money with royal style & image 🎡",
    category: "economy",
    guide: "Just type 'spin' (no prefix)",
    usePrefix: true,
    useChat: true
  },

  onStart: async function () {},

  onChat: async function ({ event, message, usersData, api }) {
    const body = event.body?.toLowerCase();
    if (body !== "spin") return;

    const uid = event.senderID;
    const user = await usersData.get(uid);
    const now = Date.now();
    const hour = 60 * 60 * 1000;
    const day = 24 * hour;

    const lastSpinReset = user.lastSpinReset || 0;
    const lastHourReset = user.lastHourReset || 0;
    let dailySpins = user.dailySpins || 0;
    let hourlySpins = user.hourlySpins || 0;

    if (now - lastSpinReset >= day) {
      dailySpins = 0;
      await usersData.set(uid, { lastSpinReset: now });
    }
    if (now - lastHourReset >= hour) {
      hourlySpins = 0;
      await usersData.set(uid, { lastHourReset: now });
    }

    if (dailySpins >= 20)
      return message.reply("🌙 𝓨𝓸𝓾'𝓿𝓮 𝓾𝓼𝓮𝓭 𝓪𝓵𝓵 20 𝓼𝓹𝓲𝓷𝓼 𝓽𝓸𝓭𝓪𝔂~ 💫");
    if (hourlySpins >= 3)
      return message.reply("⏳ 𝓢𝓵𝓸𝔀 𝓭𝓸𝔀𝓷~ 𝓞𝓷𝓵𝔂 3 𝓼𝓹𝓲𝓷𝓼 𝓹𝓮𝓻 𝓱𝓸𝓾𝓻~");

    // Define sections
    const sections = [
      { label: "$10", color: "#FFB6C1" },
      { label: "$25", color: "#FFD700" },
      { label: "$50", color: "#ADFF2F" },
      { label: "$100", color: "#00CED1" },
      { label: "$150", color: "#9370DB" },
      { label: "$200", color: "#FF4500" },
      { label: "$75", color: "#20B2AA" },
      { label: "$5", color: "#FF69B4" }
    ];
    const resultIndex = Math.floor(Math.random() * sections.length);
    const rewardText = sections[resultIndex].label;
    const rewardAmount = parseInt(rewardText.replace("$", ""));

    await usersData.addMoney(uid, rewardAmount);
    await usersData.set(uid, {
      dailySpins: dailySpins + 1,
      hourlySpins: hourlySpins + 1
    });

    // Create image
    const size = 600;
    const center = size / 2;
    const finalHeight = size + 100;
    const canvas = createCanvas(size, finalHeight);
    const ctx = canvas.getContext("2d");

    const anglePerSection = 360 / sections.length;

    // Draw wheel
    for (let i = 0; i < sections.length; i++) {
      const startAngle = (anglePerSection * i * Math.PI) / 180;
      const endAngle = (anglePerSection * (i + 1) * Math.PI) / 180;
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, center, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = sections[i].color;
      ctx.fill();

      // Draw label
      const midAngle = (startAngle + endAngle) / 2;
      const textX = center + (center - 80) * Math.cos(midAngle);
      const textY = center + (center - 80) * Math.sin(midAngle);
      ctx.fillStyle = "#000";
      ctx.font = "bold 20px Arial";
      ctx.fillText(sections[i].label, textX - 20, textY);
    }

    // Center circle
    ctx.beginPath();
    ctx.arc(center, center, 40, 0, Math.PI * 2);
    ctx.fillStyle = "#fff";
    ctx.fill();
    ctx.strokeStyle = "#000";
    ctx.stroke();

    // Pointer
    ctx.beginPath();
    ctx.moveTo(center, 10);
    ctx.lineTo(center - 20, 40);
    ctx.lineTo(center + 20, 40);
    ctx.closePath();
    ctx.fillStyle = "#000";
    ctx.fill();

    // Result Box
    ctx.fillStyle = "#FFF8DC";
    ctx.fillRect(0, size, size, 100);
    ctx.strokeStyle = "#000";
    ctx.strokeRect(0, size, size, 100);
    ctx.fillStyle = "#000";
    ctx.font = "28px Arial";
    ctx.fillText(`🎉 You won ${rewardText}!`, center - 120, size + 60);

    // Save + send
    const imgPath = path.join(__dirname, "cache", `spin_${uid}.png`);
    await fs.ensureDir(path.dirname(imgPath));
    fs.writeFileSync(imgPath, canvas.toBuffer());

    // Anime styled result message
    await message.reply(`🎰✨ 𝓢𝓹𝓲𝓷 𝓼𝓾𝓬𝓬𝓮𝓼𝓼~!\n\n💸 𝓨𝓸𝓾 𝔀𝓸𝓷: ${rewardText}\n📅 𝓓𝓪𝓲𝓵𝔂: ${dailySpins + 1}/20\n🕐 𝓗𝓸𝓾𝓻𝓵𝔂: ${hourlySpins + 1}/3`);

    return message.reply({
      body: "",
      attachment: fs.createReadStream(imgPath)
    });
  }
};
