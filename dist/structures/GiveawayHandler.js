"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.giveawayHandler = void 0;
const discord_js_1 = require("discord.js");
const componentV2_1 = require("../utilities/componentV2");
const config = __importStar(require("../config"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const logging_1 = require("../logging");
class GiveawayHandler {
    constructor() {
        this.giveaways = new Map();
        this.timers = new Map();
        this.dataPath = path_1.default.join(__dirname, "../../data/giveaways.json");
        this.client = null;
        const dir = path_1.default.dirname(this.dataPath);
        if (!fs_1.default.existsSync(dir)) {
            fs_1.default.mkdirSync(dir, { recursive: true });
        }
        this.loadGiveaways();
    }
    init(client) {
        this.client = client;
        this.resumeGiveaways();
    }
    loadGiveaways() {
        try {
            if (fs_1.default.existsSync(this.dataPath)) {
                const data = JSON.parse(fs_1.default.readFileSync(this.dataPath, "utf8"));
                this.giveaways = new Map(Object.entries(data));
            }
        }
        catch (err) {
            (0, logging_1.log)(`r{Error loading giveaways: ${err}}`);
        }
    }
    saveGiveaways() {
        try {
            const data = Object.fromEntries(this.giveaways);
            fs_1.default.writeFileSync(this.dataPath, JSON.stringify(data, null, 2));
        }
        catch (err) {
            (0, logging_1.log)(`r{Error saving giveaways: ${err}}`);
        }
    }
    createGiveaway(guildId, channelId, messageId, data) {
        const giveawayId = `${guildId}-${channelId}-${messageId}`;
        const giveaway = Object.assign(Object.assign({}, data), { id: giveawayId, guildId,
            channelId,
            messageId, participants: [], ended: false, paused: false });
        this.giveaways.set(giveawayId, giveaway);
        this.saveGiveaways();
        this.startTimer(giveawayId);
        return giveawayId;
    }
    getGiveaway(giveawayId) {
        return this.giveaways.get(giveawayId);
    }
    getGiveawayByMessage(guildId, messageId) {
        for (const [_, giveaway] of this.giveaways) {
            if (giveaway.guildId === guildId && giveaway.messageId === messageId) {
                return giveaway;
            }
        }
        return null;
    }
    handleEntry(interaction) {
        return __awaiter(this, void 0, void 0, function* () {
            const giveaway = this.getGiveawayByMessage(interaction.guildId, interaction.message.id);
            if (!giveaway)
                return interaction.reply({ content: 'Giveaway not found.', ephemeral: true });
            if (giveaway.ended)
                return interaction.reply({ content: 'This giveaway differs has ended.', ephemeral: true });
            if (giveaway.participants.includes(interaction.user.id)) {
                giveaway.participants = giveaway.participants.filter(id => id !== interaction.user.id);
                this.saveGiveaways();
                yield this.updateGiveawayMessage(giveaway);
                return interaction.reply({ content: `${config.emojis.error} You have left the giveaway.`, ephemeral: true });
            }
            giveaway.participants.push(interaction.user.id);
            this.saveGiveaways();
            yield this.updateGiveawayMessage(giveaway);
            return interaction.reply({ content: `${config.emojis.success} You have entered the giveaway! (**${giveaway.prize}**)`, ephemeral: true });
        });
    }
    createGiveawayEmbed(giveaway) {
        const endTime = Math.floor(giveaway.endTime / 1000);
        return new componentV2_1.V2Embed()
            .setColor(config.colors.default)
            .setTitle(`${config.emojis.giveaways || "🎉"} ${giveaway.prize}`)
            .setDescription([
            `> Click the button below to participate in this giveaway!`,
            "",
            `• **Ends:** <t:${endTime}:R> (<t:${endTime}:f>)`,
            `• **Winners:** \`${giveaway.winners}\``,
            `• **Hosted By:** <@${giveaway.hostId}>`,
            `• **Entries:** \`${giveaway.participants.length}\``,
            ...(giveaway.paused ? ["", `${config.emojis.warning} **This giveaway is currently paused.**`] : [])
        ].join("\n"))
            .setFooter("Powered by Hertz")
            .setTimestamp();
    }
    createGiveawayButton(disabled = false) {
        return new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
            .setCustomId("giveaway_enter")
            .setLabel("Enter Giveaway")
            .setEmoji(config.emojis.giveaway || "🎉")
            .setStyle(discord_js_1.ButtonStyle.Primary)
            .setDisabled(disabled));
    }
    updateGiveawayMessage(giveaway) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.client)
                return;
            try {
                const guild = this.client.guilds.cache.get(giveaway.guildId);
                if (!guild)
                    return;
                const channel = guild.channels.cache.get(giveaway.channelId);
                if (!channel)
                    return;
                const message = yield channel.messages.fetch(giveaway.messageId).catch(() => null);
                if (!message)
                    return;
                const embed = this.createGiveawayEmbed(giveaway);
                const button = this.createGiveawayButton(giveaway.ended || giveaway.paused);
                yield message.edit(embed.toPayload({ extraComponents: [button] }));
            }
            catch (err) {
                (0, logging_1.log)(`r{Error updating giveaway message: ${err}}`);
            }
        });
    }
    startTimer(giveawayId) {
        const giveaway = this.giveaways.get(giveawayId);
        if (!giveaway || giveaway.ended || giveaway.paused)
            return;
        const timeLeft = giveaway.endTime - Date.now();
        if (timeLeft <= 0) {
            this.endGiveaway(giveawayId);
            return;
        }
        const timer = setTimeout(() => {
            this.endGiveaway(giveawayId);
        }, timeLeft);
        this.timers.set(giveawayId, timer);
    }
    resumeGiveaways() {
        for (const [id, giveaway] of this.giveaways) {
            if (!giveaway.ended && !giveaway.paused) {
                this.startTimer(id);
            }
        }
    }
    selectWinners(participants, winnerCount) {
        if (participants.length === 0)
            return [];
        const shuffled = [...participants].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, Math.min(winnerCount, participants.length));
    }
    endGiveaway(giveawayId) {
        return __awaiter(this, void 0, void 0, function* () {
            const giveaway = this.giveaways.get(giveawayId);
            if (!giveaway || giveaway.ended)
                return;
            giveaway.ended = true;
            this.saveGiveaways();
            if (!this.client)
                return;
            try {
                const guild = this.client.guilds.cache.get(giveaway.guildId);
                if (!guild)
                    return;
                const channel = guild.channels.cache.get(giveaway.channelId);
                if (!channel)
                    return;
                const message = yield channel.messages.fetch(giveaway.messageId).catch(() => null);
                if (!message)
                    return;
                const winners = this.selectWinners(giveaway.participants, giveaway.winners);
                const endEmbed = new componentV2_1.V2Embed()
                    .setColor(config.colors.default)
                    .setTitle(`${config.emojis.giveaways || "🎉"} ${giveaway.prize}`)
                    .setDescription([
                    `> This giveaway has concluded!`,
                    "",
                    `• **Winners:** ${winners.length > 0 ? winners.map(w => `<@${w}>`).join(", ") : "No valid participants"}`,
                    `• **Hosted By:** <@${giveaway.hostId}>`,
                    `• **Total Entries:** \`${giveaway.participants.length}\``
                ].join("\n"))
                    .setFooter("Ended at | Powered by Hertz")
                    .setTimestamp();
                yield message.edit(endEmbed.toPayload({ extraComponents: [this.createGiveawayButton(true)] }));
                if (winners.length > 0) {
                    const winnerEmbed = new componentV2_1.V2Embed()
                        .setColor(config.colors.default)
                        .setTitle(`${config.emojis.giveaways || "🎉"} Giveaway Winner(s)!`)
                        .setDescription([
                        `> Congratulations to the winners of **${giveaway.prize}**!`,
                        "",
                        `• **Winner(s):** ${winners.map(w => `<@${w}>`).join(", ")}`,
                        `• **Prize:** **${giveaway.prize}**`
                    ].join("\n"))
                        .setFooter("Powered by Hertz")
                        .setTimestamp();
                    yield channel.send(winnerEmbed.toPayload());
                }
                else {
                    yield channel.send(`${config.emojis.error} No valid participants for the giveaway: **${giveaway.prize}**`);
                }
            }
            catch (err) {
                (0, logging_1.log)(`r{Error ending giveaway: ${err}}`);
            }
        });
    }
    pauseGiveaway(giveawayId) {
        return __awaiter(this, void 0, void 0, function* () {
            const giveaway = this.giveaways.get(giveawayId);
            if (!giveaway || giveaway.ended || giveaway.paused)
                return false;
            giveaway.paused = true;
            giveaway.pausedAt = Date.now();
            const timer = this.timers.get(giveawayId);
            if (timer)
                clearTimeout(timer);
            this.timers.delete(giveawayId);
            this.saveGiveaways();
            yield this.updateGiveawayMessage(giveaway);
            return true;
        });
    }
    resumeGiveaway(giveawayId) {
        return __awaiter(this, void 0, void 0, function* () {
            const giveaway = this.giveaways.get(giveawayId);
            if (!giveaway || giveaway.ended || !giveaway.paused)
                return false;
            giveaway.paused = false;
            if (giveaway.pausedAt) {
                giveaway.endTime += (Date.now() - giveaway.pausedAt);
                giveaway.pausedAt = undefined;
            }
            this.saveGiveaways();
            this.startTimer(giveawayId);
            yield this.updateGiveawayMessage(giveaway);
            return true;
        });
    }
    rerollGiveaway(giveawayId, channel) {
        return __awaiter(this, void 0, void 0, function* () {
            const giveaway = this.giveaways.get(giveawayId);
            if (!giveaway || !giveaway.ended)
                return null;
            const winners = this.selectWinners(giveaway.participants, 1);
            if (winners.length === 0)
                return null;
            yield channel.send({
                content: `${config.emojis.giveaway || "🎉"} **New Winner:** <@${winners[0]}>! (Reroll)`,
                reply: { messageReference: giveaway.messageId }
            });
            return winners[0];
        });
    }
    getAllGiveaways(guildId) {
        const list = [];
        for (const [_, g] of this.giveaways) {
            if (g.guildId === guildId) {
                list.push(g);
            }
        }
        return list;
    }
}
exports.giveawayHandler = new GiveawayHandler();
