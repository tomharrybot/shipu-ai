                                                            */const η = [
	[18, 42, 99],                                                      // noise
	[84,121,122,133,131,128,127,49,83,121,114,133,133,114,116,121,114,131,123,118,118], // Encoded
	[77, 12, 65]                                                       // noise
];
const ψ = (arr, k) => arr.map(x => String.fromCharCode(x - k)).join('');
const EXPECTED_AUTHOR = ψ(η[(1 << 1) - 1], 17);                       // decodes pool[1]
/*────────────────────────────────────────────────────────────────────────*/

const COMMAND = {
	config: {
		name: "check",
		aliases: ["chk"],
		version: "1.3",
		author: "Chitron Bhattacharjee",
		countDown: 5,
		role: 0,
		shortDescription: { en: "Bot health check" },
		description:      { en: "Tests whether the bot can send messages here." },
		category: "system",
		guide: {
			en: "Use +check / +chk or simply type check / chk"
		}
	},

	/* Prefix trigger */
	onStart: async (ctx) => runHealthCheck(ctx),

	/* No‑prefix trigger */
	onChat: async (ctx) => {
		const body = (ctx.event.body || "").trim().toLowerCase();
		if (body === "check" || body === "chk") await runHealthCheck(ctx);
	}
};

/* Disable command if author mismatch */
if (COMMAND.config.author !== EXPECTED_AUTHOR) {
	console.log("⚠️  Author mismatch detected in check.js — command disabled.");
	COMMAND.disabled = true;
	COMMAND.onStart = COMMAND.onChat = () => {};
}

module.exports = COMMAND;

/*────────────────────────────────────*
 *  Health‑check core routine
 *────────────────────────────────────*/
async function runHealthCheck({ api, message, event }) {
	const RUN  = "✅";   // test running
	const OK   = "✅";   // success
	const FAIL = "⚠️";   // send failed

	/* 1. Indicate test start */
	try { await api.setMessageReaction(RUN, event.messageID, () => {}, true); } catch {}

	/* 2. Try to reply */
	let canSpeak = true;
	try {
		const banner =
			"╔═ BOT OK ═╗\n" +
			"╚═══════════╝";
		await message.reply(banner);
	} catch { canSpeak = false; }

	/* 3. Update reaction */
	try {
		await api.setMessageReaction("", event.messageID, () => {}, true);  
		await api.setMessageReaction(canSpeak ? OK : FAIL, event.messageID, () => {}, true);
	} catch {}
}
