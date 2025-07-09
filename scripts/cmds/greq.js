globalrequest.js const { getStreamsFromAttachment } = global.utils;
const fs = require("fs");
const path = require("path");

// File to store active requests
const REQUEST_DATA_PATH = path.join(__dirname, "globalRequests.json");

module.exports = {
  config: {
    name: "globalrequest",
    aliases: ["grequest", "greq", "grq"],
    version: "1.0",
    author: "Chitron Bhattacharjee",
    countDown: 5,
    role: 0,
    description: {
      en: "Send global requests and handle responses"
    },
    category: "utility",
    guide: {
      en: "{pn} <request message>"
    }
  },

  onStart: async function ({ event, api, args, threadsData, message }) {
    if (!args[0]) {
      return message.reply("Please enter your global request message.");
    }

    // Load existing requests
    let requestData = {};
    try {
      if (fs.existsSync(REQUEST_DATA_PATH)) {
        requestData = JSON.parse(fs.readFileSync(REQUEST_DATA_PATH));
      }
    } catch (e) {
      console.error("Error loading request data:", e);
    }

    const requesterThread = event.threadID;
    const requesterUser = event.senderID;
    const requestID = Date.now().toString(); // Unique request ID

    // Store request information
    requestData[requestID] = {
      requesterThread,
      requesterUser,
      requestMessage: args.join(" "),
      responses: []
    };

    // Save to file
    try {
      fs.writeFileSync(REQUEST_DATA_PATH, JSON.stringify(requestData, null, 2));
    } catch (e) {
      console.error("Error saving request data:", e);
      return message.reply("❌ Failed to save request data.");
    }

    // Get all groups
    const allThreads = (await threadsData.getAll()).filter(
      t => t.isGroup && t.members.some(m => m.userID === api.getCurrentUserID() && m.inGroup)
    );

    // Send request to all groups except requester's group
    let sentCount = 0;
    const form = {
      body: `🌐 GLOBAL REQUEST #${requestID}\n`
          + `📝 Message: ${args.join(" ")}\n`
          + `👤 From: User in ${(await api.getThreadInfo(requesterThread)).name || "a group"}\n\n`
          + "💬 Reply to this message to respond to the request",
      attachment: await getStreamsFromAttachment(event.attachments)
    };

    for (const thread of allThreads) {
      if (thread.threadID === requesterThread) continue;
      
      try {
        await api.sendMessage(form, thread.threadID);
        sentCount++;
        await new Promise(resolve => setTimeout(resolve, 250)); // Delay between sends
      } catch (e) {
        console.error(`Error sending to ${thread.threadID}:`, e);
      }
    }

    message.reply(`✅ Your request has been sent to ${sentCount} groups! Request ID: ${requestID}`);
  },

  onReply: async function ({ event, api, message, Reply, threadsData }) {
    const { type, author } = Reply;
    if (type !== "reply" || author !== "globalrequest") return;
    
    // Load request data
    let requestData = {};
    try {
      if (fs.existsSync(REQUEST_DATA_PATH)) {
        requestData = JSON.parse(fs.readFileSync(REQUEST_DATA_PATH));
      } else {
        return;
      }
    } catch (e) {
      console.error("Error loading request data:", e);
      return;
    }

    const requestID = Reply.messageID.split("_")[1]; // Extract request ID
    const request = requestData[requestID];
    
    if (!request) {
      return message.reply("❌ Request not found or expired.");
    }

    // Get responder info
    const responderName = (await api.getUserInfo(event.senderID))[event.senderID].name;
    const groupName = (await api.getThreadInfo(event.threadID)).name || "a group";

    // Format response message
    const responseMessage = {
      body: `📨 RESPONSE TO REQUEST #${requestID}\n`
          + `👤 From: ${responderName} (${groupName})\n`
          + `💬 Message: ${event.body || "<no text>"}\n\n`
          + `📝 Original Request: ${request.requestMessage}`,
      attachment: await getStreamsFromAttachment(event.attachments)
    };

    // Send to original requester's group
    try {
      await api.sendMessage(responseMessage, request.requesterThread);
      
      // Store response
      request.responses.push({
        responderID: event.senderID,
        threadID: event.threadID,
        timestamp: Date.now()
      });
      
      // Update request data
      fs.writeFileSync(REQUEST_DATA_PATH, JSON.stringify(requestData, null, 2));
      
      // Confirm to responder
      message.reply("✅ Your response has been forwarded!");
    } catch (e) {
      console.error("Error forwarding response:", e);
      message.reply("❌ Failed to forward your response.");
    }
  }
};