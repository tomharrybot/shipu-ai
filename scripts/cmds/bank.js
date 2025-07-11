
const fs        = require("fs");
const path      = require("path");
const mongoose  = require("mongoose");

/* 𝗖𝗼𝗻𝗳𝗶𝗴 𝘃𝗶𝗮 𝗰𝗼𝗻𝗳𝗶𝗴.𝗱𝗲𝘃.𝗷𝘀𝗼𝗻 (𝗿𝗼𝗼𝘁) */
const configPath = path.resolve(process.cwd(), "config.dev.json");
const { mongoURI } = JSON.parse(fs.readFileSync(configPath, "utf-8"));

/* 𝗠𝗼𝗻𝗴𝗼𝗗𝗕 𝗰𝗼𝗻𝗻𝗲𝗰𝘁 (𝗼𝗻𝗹𝘆 𝗼𝗻𝗰𝗲) */
if (!mongoose.connections[0].readyState) {
  mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
}

/* 𝗦𝗰𝗵𝗲𝗺𝗮 / 𝗠𝗼𝗱𝗲𝗹 */
const bankSchema = new mongoose.Schema({
  uid:               { type: String, required: true, unique: true },
  bank:              { type: Number, default: 0 },
  lastInterestClaimed:{ type: Number, default: Date.now },
  loan:              { type: Number, default: 0 },
  loanPayed:         { type: Boolean, default: true }
});
const Bank = mongoose.models.Bank || mongoose.model("Bank", bankSchema);

/* 𝗨𝘁𝗶𝗹 */
const suffix = ["","K","M","B","T","Qa","Qi","Sx","Sp","Oc","No","Dc"];
function fmt(n){let i=0;while(n>=1e3&&i<suffix.length-1){n/=1e3;i++;}return n.toFixed(2)+suffix[i];}
const pos = n => !isNaN(n)&&n>0;

/* ╭────────────────────────────╮
   │      🏦 𝐂𝐮𝐭𝐞𝐁𝐚𝐧𝐤 🏦       │
   ╰────────────────────────────╯ */
module.exports = {
  config: {
    name: "bank",
    aliases: ["b"],
    version: "2.2",
    author: "Chitron Bhattacharjee",
    role: 0,
    shortDescription: { en: "Cute bank system with MongoDB" },
    description:     { en: "Deposit, withdraw, loan, interest, transfer" },
    category: "𝗪𝗔𝗟𝗟𝗘𝗧",
    guide: { en: "bank d|w|b|i|t|r|l|p …" }
  },

  async onStart({ args, message, event, usersData }) {
    const uid   = String(event.senderID);
    let user    = await Bank.findOne({ uid }) || await Bank.create({ uid });
    const cash  = await usersData.get(uid, "money") ?? 0;

    const map = {d:"deposit",w:"withdraw",b:"balance",i:"interest",t:"transfer",r:"richest",l:"loan",p:"payloan"};
    let cmd   = (args[0]||"").toLowerCase();
    cmd       = map[cmd] || cmd;
    const amt = parseInt(args[1]);
    const to  = String(args[2]||"");

    switch(cmd){

      case "deposit":{
        if(!pos(amt))           return say("🌸 𝐄𝐧𝐭𝐞𝐫 𝐯𝐚𝐥𝐢𝐝 𝐝𝐞𝐩𝐨𝐬𝐢𝐭 𝐚𝐦𝐨𝐮𝐧𝐭 🌸");
        if(user.bank>=1e104)    return say("💰 𝐁𝐚𝐧𝐤 𝐚𝐥𝐫𝐞𝐚𝐝𝐲 𝐦𝐚𝐱 💰");
        if(cash<amt)            return say("😿 𝐍𝐨𝐭 𝐞𝐧𝐨𝐮𝐠𝐡 𝐰𝐚𝐥𝐥𝐞𝐭 😿");
        user.bank+=amt; await user.save();
        await usersData.set(uid,{money:cash-amt});
        return say(`🎀 𝐃𝐞𝐩𝐨𝐬𝐢𝐭𝐞𝐝 ＄${amt} 🎀`);
      }

      case "withdraw":{
        if(!pos(amt))           return say("🌸 𝐄𝐧𝐭𝐞𝐫 𝐯𝐚𝐥𝐢𝐝 𝐰𝐢𝐭𝐡𝐝𝐫𝐚𝐰 🌸");
        if(amt>user.bank)       return say("😿 𝐁𝐚𝐥𝐚𝐧𝐜𝐞 𝐢𝐧𝐬𝐮𝐟𝐟𝐢𝐜𝐢𝐞𝐧𝐭 😿");
        if(cash>=1e104)         return say("🤯 𝐖𝐚𝐥𝐥𝐞𝐭 𝐦𝐚𝐱 🤯");
        user.bank-=amt; await user.save();
        await usersData.set(uid,{money:cash+amt});
        return say(`🎀 𝐖𝐢𝐭𝐡𝐝𝐫𝐞𝐰 ＄${amt} 🎀`);
      }

      case "balance":
        return say(`💎 𝐁𝐚𝐧𝐤: ＄${fmt(user.bank)} 💎`);

      case "interest":{
        const rate=0.001,now=Date.now(),sec=(now-user.lastInterestClaimed)/1000;
        if(sec<86400){
          const h=Math.floor((86400-sec)/3600),m=Math.floor(((86400-sec)%3600)/60);
          return say(`⏳ 𝐍𝐞𝐱𝐭 𝐢𝐧 ${h}𝐡 ${m}𝐦 ⏳`);
        }
        if(user.bank<=0)        return say("🌱 𝐃𝐞𝐩𝐨𝐬𝐢𝐭 𝐟𝐢𝐫𝐬𝐭 🌱");
        const earn=user.bank*(rate/970)*sec;
        user.bank+=earn; user.lastInterestClaimed=now; await user.save();
        return say(`✨ 𝐈𝐧𝐭𝐞𝐫𝐞𝐬𝐭 ＄${fmt(earn)} 𝐚𝐝𝐝𝐞𝐝 ✨`);
      }

      case "transfer":{
        if(!pos(amt))           return say("🌸 𝐄𝐧𝐭𝐞𝐫 𝐯𝐚𝐥𝐢𝐝 𝐚𝐦𝐨𝐮𝐧𝐭 🌸");
        if(to===uid)            return say("🙈 𝐍𝐨 𝐬𝐞𝐥𝐟 𝐭𝐫𝐚𝐧𝐬𝐟𝐞𝐫 🙈");
        const rec=await Bank.findOne({uid:to});
        if(!rec)                return say("🔍 𝐑𝐞𝐜𝐢𝐩𝐢𝐞𝐧𝐭 𝐧𝐨𝐭 𝐟𝐨𝐮𝐧𝐝 🔍");
        if(rec.bank>=1e104)     return say("💰 𝐑𝐞𝐜𝐢𝐩𝐢𝐞𝐧𝐭 𝐦𝐚𝐱 💰");
        if(amt>user.bank)       return say("😿 𝐁𝐚𝐧𝐤 𝐢𝐧𝐬𝐮𝐟𝐟𝐢𝐜𝐢𝐞𝐧𝐭 😿");
        user.bank-=amt; rec.bank+=amt; await user.save(); await rec.save();
        return say(`🎁 𝐓𝐫𝐚𝐧𝐬𝐟𝐞𝐫𝐞𝐝 ＄${amt} 𝐭𝐨 ${to} 🎁`);
      }

      case "richest":{
        const top=await Bank.find().sort({bank:-1}).limit(10);
        const lines=await Promise.all(top.map(async(d,i)=>`${i+1}. ${await usersData.getName(d.uid)} – ＄${fmt(d.bank)}`));
        return say("👑 𝐓𝐨𝐩 𝟏𝟎 👑\n"+lines.join("\n"));
      }

      case "loan":{
        const max=100000000;
        if(!pos(amt))           return say("🌸 𝐄𝐧𝐭𝐞𝐫 𝐯𝐚𝐥𝐢𝐝 𝐥𝐨𝐚𝐧 🌸");
        if(amt>max)             return say("🚫 𝐌𝐚𝐱 𝐥𝐨𝐚𝐧 ＄𝟏𝟎𝟎𝐌 🚫");
        if(!user.loanPayed&&user.loan>0) return say(`💸 𝐑𝐞𝐩𝐚𝐲 ＄${fmt(user.loan)} 𝐟𝐢𝐫𝐬𝐭 💸`);
        user.bank+=amt; user.loan+=amt; user.loanPayed=false; await user.save();
        return say(`🧧 𝐋𝐨𝐚𝐧 ＄${amt} 𝐠𝐫𝐚𝐧𝐭𝐞𝐝 🧧`);
      }

      case "payloan":{
        if(!pos(amt))           return say("🌸 𝐄𝐧𝐭𝐞𝐫 𝐫𝐞𝐩𝐚𝐲 𝐚𝐦𝐨𝐮𝐧𝐭 🌸");
        if(user.loan<=0)        return say("🎉 𝐍𝐨 𝐥𝐨𝐚𝐧 𝐝𝐮𝐞 🎉");
        if(amt>user.loan)       return say(`⚖️ 𝐏𝐚𝐲 𝐞𝐱𝐚𝐜𝐭 ＄${fmt(user.loan)} ⚖️`);
        if(amt>cash)            return say("😢 𝐖𝐚𝐥𝐥𝐞𝐭 𝐭𝐨𝐨 𝐥𝐨𝐰 😢");
        user.loan-=amt; if(user.loan===0)user.loanPayed=true; await user.save();
        await usersData.set(uid,{money:cash-amt});
        return say(`✅ 𝐏𝐚𝐢𝐝 ＄${amt}. 𝐑𝐞𝐦𝐚𝐢𝐧𝐢𝐧𝐠 ＄${fmt(user.loan)} ✅`);
      }

      default:
        return say("📔 𝐔𝐬𝐚𝐠𝐞: d|w|b|i|t|r|l|p 📔");
    }

    function say(txt){
      return message.reply(`🏦🌸 𝐂𝐮𝐭𝐞𝐁𝐚𝐧𝐤 🌸🏦\n${txt}\n🌸✨`);
    }
  }
};
