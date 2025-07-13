const leven = require("leven");

module.exports = {
	config: {
		name: "fallback",
		version: "1.0",
		author: "Chitron Bhattacharjee",
		category: "system",
		role: 0
	},

	onChat: async function ({ message, event, api, commandName, usersData, threadsData, globalData }) {
		// Extract message text, assume prefix is '+'
		const prefix = "+";
		if (!event.body || !event.body.startsWith(prefix)) return;

		const args = event.body.slice(prefix.length).trim().split(/\s+/);
		const inputCmd = args[0].toLowerCase();

		// Get all commands from global.GoatBot.commands
		const commands = [...global.GoatBot.commands.values()];

		// Check if command exists exactly (name or alias)
		const exactCmd = commands.find(cmd => {
			if (cmd.config.name.toLowerCase() === inputCmd) return true;
			if (cmd.config.aliases && cmd.config.aliases.some(a => a.toLowerCase() === inputCmd)) return true;
			return false;
		});

		if (exactCmd) return; // Command exists, no fallback needed

		// Find closest command by leven distance (threshold 3)
		let closest = null;
		let minDistance = 999;
		for (const cmd of commands) {
			const names = [cmd.config.name.toLowerCase()];
			if (cmd.config.aliases) names.push(...cmd.config.aliases.map(a => a.toLowerCase()));
			for (const name of names) {
				const dist = leven(inputCmd, name);
				if (dist < minDistance) {
					minDistance = dist;
					closest = cmd;
				}
			}
		}

		if (!closest || minDistance > 3) return; // No close command found

		// Send suggestion message
		const suggestMsg = await api.sendMessage(
			`❌ Command "${inputCmd}" not found.\n🔎 Did you mean "${closest.config.name}"?\n\nReply to this message with "yes" to run it!`,
			event.threadID,
			(event.messageID)
		);

		// Store suggestion for reply check
		global.GoatBot.onReply.set(suggestMsg.messageID, {
			commandName: closest.config.name,
			args: args.slice(1),
			threadID: event.threadID,
			userID: event.senderID,
			originalInput: inputCmd
		});
	},

	onReply: async function ({ event, api, message, Reply, usersData, threadsData, globalData }) {
		const { messageID, args, commandName, userID, threadID } = Reply;

		// Only allow original user to confirm
		if (event.senderID !== userID) return;

		const replyText = event.body?.toLowerCase().trim();
		if (replyText !== "yes") return; // Only act on reply "yes"

		// Run the suggested command
		const cmd = global.GoatBot.commands.get(commandName);
		if (!cmd) return;

		// Prepare fake context for command execution
		// We run onStart with updated args and event

		// Clone event and override body and args for the suggested command
		const newEvent = { ...event };
		newEvent.body = "+" + commandName + " " + (args.join(" ") || "");
		newEvent.senderID = userID;
		newEvent.threadID = threadID;

		// Prepare context object
		const context = {
			api,
			args,
			event: newEvent,
			message,
			usersData,
			threadsData,
			globalData,
			commandName,
			getLang: (key) => cmd.langs?.en?.[key] || key // fallback to English lang strings if available
		};

		try {
			await cmd.onStart(context);
		} catch (e) {
			console.error("Error running fallback command:", e);
			return api.sendMessage("❌ Error running the suggested command.", threadID);
		}

		// Delete the suggestion message and confirmation reply to keep chat clean
		try {
			await api.unsendMessage(messageID);
			await api.unsendMessage(event.messageID);
		} catch {}

		// Optionally, send a confirmation
		await api.sendMessage(`✅ Command "${commandName}" executed as requested.`, threadID);
	}
};
