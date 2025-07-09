const Canvas = require("canvas");
const fs = require("fs-extra");
const path = require("path");
const { randomString } = global.utils;

// Font register
const FONT_PATH_BOLD = path.join(__dirname, "assets", "font", "BeVietnamPro-Bold.ttf");
Canvas.registerFont(FONT_PATH_BOLD, { family: "BeVietnamPro-Bold" });

const deltaNext = 5;

function expToLevel(exp) {
	return Math.floor((1 + Math.sqrt(1 + 8 * exp / deltaNext)) / 2);
}

function getRandomColor() {
	const colors = ["#5eead4", "#38bdf8", "#c084fc", "#f472b6", "#facc15", "#4ade80"];
	return colors[Math.floor(Math.random() * colors.length)];
}

function shortText(text, max) {
	return text.length > max ? text.slice(0, max - 3) + "..." : text;
}

module.exports = {
	config: {
		name: "view",
		version: "1.3",
		author: "Chitron Bhattacharjee",
		countDown: 5,
		role: 0,
		shortDescription: { en: "Show EXP leaderboard (image)" },
		longDescription: { en: "View top 10 EXP earners as an image leaderboard" },
		category: "ranking",
		guide: { en: "Type 'view'" }
	},

	onChat: async function ({ event }) {
		if (event.body?.toLowerCase() === "view")
			return this.onStart(...arguments);
	},

	onStart: async function ({ message, usersData }) {
		try {
			const allUsers = await usersData.getAll();
			const sorted = allUsers
				.filter(u => u.exp > 0)
				.sort((a, b) => b.exp - a.exp)
				.slice(0, 10);

			const canvasWidth = 768;
			const canvasHeight = 1024;
			const canvas = Canvas.createCanvas(canvasWidth, canvasHeight);
			const ctx = canvas.getContext("2d");

			// Background
			const gradient = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight);
			gradient.addColorStop(0, getRandomColor());
			gradient.addColorStop(1, getRandomColor());
			ctx.fillStyle = gradient;
			ctx.fillRect(0, 0, canvasWidth, canvasHeight);

			// Title
			ctx.fillStyle = "#fff";
			ctx.font = "bold 40px BeVietnamPro-Bold";
			ctx.textAlign = "center";
			ctx.fillText("🏆 EXP LEADERBOARD", canvasWidth / 2, 60);

			// Rank Icons
			const icons = ["👑", "🥈", "🥉", "🎖️", "🎖️", "🎖️", "🏅", "🏅", "🏅", "🎯"];

			for (let i = 0; i < sorted.length; i++) {
				const user = sorted[i];
				const y = 110 + i * 85;

				const level = expToLevel(user.exp);
				const emoji = icons[i] || "🎗️";
				const name = shortText(user.name || "Unknown", 20);

				let avatar;
				try {
					const avatarUrl = await usersData.getAvatarUrl(user.userID);
					avatar = await Canvas.loadImage(avatarUrl);
				} catch {
					avatar = await Canvas.loadImage("https://i.imgur.com/IBlsk9e.png"); // fallback
				}

				// Draw background row
				ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
				ctx.fillRect(50, y - 40, 670, 70);

				// Avatar circle
				ctx.save();
				ctx.beginPath();
				ctx.arc(90, y - 5, 25, 0, Math.PI * 2);
				ctx.closePath();
				ctx.clip();
				ctx.drawImage(avatar, 65, y - 30, 50, 50);
				ctx.restore();

				// Text
				ctx.fillStyle = "#FFD700";
				ctx.font = "24px BeVietnamPro-Bold";
				ctx.textAlign = "left";
				ctx.fillText(`${emoji} ${name}`, 140, y - 5);

				ctx.fillStyle = "#ffffff";
				ctx.font = "18px BeVietnamPro-Bold";
				ctx.fillText(`Lv.${level} — ${user.exp.toLocaleString()} XP`, 140, y + 20);
			}

			// Footer
			ctx.fillStyle = "#fff";
			ctx.font = "16px BeVietnamPro-Bold";
			ctx.textAlign = "center";
			ctx.fillText(`Generated: ${new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" })}`, canvasWidth / 2, canvasHeight - 20);

			// Save file
			const imgName = `view_${randomString(6)}.png`;
			const filePath = path.join(__dirname, "cache", imgName);
			await fs.ensureDir(path.dirname(filePath));
			await fs.writeFile(filePath, canvas.toBuffer("image/png"));

			// Send
			return message.reply({
				body: "📊 𝗧𝗢𝗣 𝟭𝟬 𝗘𝗫𝗣 & 𝗟𝗲𝘃𝗲𝗹 𝗨𝘀𝗲𝗿𝘀",
				attachment: fs.createReadStream(filePath)
			});
		} catch (err) {
			console.error("❌ view.js error:", err);
			return message.reply("🚫 Couldn't create EXP leaderboard.");
		}
	}
};
