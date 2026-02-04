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
exports.command = void 0;
exports.run = run;
exports.handleStart = handleStart;
exports.handleEnd = handleEnd;
exports.handleReroll = handleReroll;
exports.handlePause = handlePause;
exports.handleResume = handleResume;
exports.handleList = handleList;
const discord_js_1 = require("discord.js");
const config = __importStar(require("../../config"));
const GiveawayHandler_1 = require("../../structures/GiveawayHandler");
const ms_1 = __importDefault(require("ms"));
exports.command = new discord_js_1.SlashCommandBuilder()
    .setName('giveaway')
    .setDescription('Manage giveaways')
    .addSubcommand(subcommand => subcommand
    .setName('start')
    .setDescription('Start a new giveaway')
    .addStringOption(option => option.setName('time')
    .setDescription('Duration (e.g. 1m, 1h, 1d)')
    .setRequired(true))
    .addIntegerOption(option => option.setName('winners')
    .setDescription('Number of winners')
    .setMinValue(1)
    .setMaxValue(20)
    .setRequired(true))
    .addStringOption(option => option.setName('prize')
    .setDescription('Prize for the giveaway')
    .setRequired(true)))
    .addSubcommand(subcommand => subcommand
    .setName('end')
    .setDescription('End a giveaway early')
    .addStringOption(option => option.setName('message_id')
    .setDescription('The message ID of the giveaway')
    .setRequired(true)))
    .addSubcommand(subcommand => subcommand
    .setName('reroll')
    .setDescription('Reroll a giveaway winner')
    .addStringOption(option => option.setName('message_id')
    .setDescription('The message ID of the giveaway')
    .setRequired(true)))
    .addSubcommand(subcommand => subcommand
    .setName('pause')
    .setDescription('Pause a giveaway')
    .addStringOption(option => option.setName('message_id')
    .setDescription('The message ID')
    .setRequired(true)))
    .addSubcommand(subcommand => subcommand
    .setName('resume')
    .setDescription('Resume a paused giveaway')
    .addStringOption(option => option.setName('message_id')
    .setDescription('The message ID')
    .setRequired(true)))
    .addSubcommand(subcommand => subcommand
    .setName('list')
    .setDescription('List all active giveaways'));
const embedStyle = (interaction, title, description, color = config.colors.primary) => {
    var _a;
    return new discord_js_1.EmbedBuilder()
        .setColor(color)
        .setDescription(`**${config.emojis.giveaways || "🎉"} ${title}**\n\n${description}`)
        .setThumbnail(((_a = interaction.client.user) === null || _a === void 0 ? void 0 : _a.displayAvatarURL()) || null)
        .setFooter({ text: `Requested by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });
};
function run(interaction, database) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        if (!interaction.guild)
            return;
        const subcommand = interaction.options.getSubcommand(false);
        console.log(`[Giveaway] Run called by ${interaction.user.tag}. Subcommand: '${subcommand}'`);
        if (subcommand === 'list' || !subcommand) {
            if (subcommand === 'list') {
                yield handleList(interaction);
            }
            else {
                const embed = new discord_js_1.EmbedBuilder()
                    .setColor(config.colors.primary)
                    .setThumbnail(((_a = interaction.client.user) === null || _a === void 0 ? void 0 : _a.displayAvatarURL()) || null)
                    .setDescription(`**${config.emojis.giveaways || "🎉"} Giveaway Commands**\n\n` +
                    "`gstart` , `gend` , `gpause`\n" +
                    "`gresume` , `greroll` , `glist`")
                    .setFooter({ text: `Requested by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });
                yield interaction.reply({ embeds: [embed] });
            }
            return;
        }
        if (!((_b = interaction.memberPermissions) === null || _b === void 0 ? void 0 : _b.has(discord_js_1.PermissionFlagsBits.ManageMessages)) && interaction.user.id !== process.env.OWNER_ID) {
            const embed = new discord_js_1.EmbedBuilder()
                .setColor(config.colors.error)
                .setDescription(`${config.emojis.error} You do not have permission to manage giveaways. (Requires \`Manage Messages\`)`)
                .setFooter({ text: `Requested by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        if (subcommand === 'start') {
            yield handleStart(interaction);
        }
        else if (subcommand === 'end') {
            yield handleEnd(interaction);
        }
        else if (subcommand === 'reroll') {
            yield handleReroll(interaction);
        }
        else if (subcommand === 'pause') {
            yield handlePause(interaction);
        }
        else if (subcommand === 'resume') {
            yield handleResume(interaction);
        }
    });
}
function handleStart(interaction) {
    return __awaiter(this, void 0, void 0, function* () {
        const timeArg = interaction.options.getString('time', true);
        const winners = interaction.options.getInteger('winners', true);
        const prize = interaction.options.getString('prize', true);
        const duration = (0, ms_1.default)(timeArg);
        if (!duration || duration < 10000) {
            const embed = new discord_js_1.EmbedBuilder()
                .setColor(config.colors.error)
                .setDescription(`${config.emojis.error} Please provide a valid duration (minimum 10s). Example: \`1h\`, \`1d\`.`)
                .setFooter({ text: `Requested by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        const endTime = Date.now() + duration;
        const giveawayData = {
            prize,
            winners,
            hostId: interaction.user.id,
            startTime: Date.now(),
            endTime,
        };
        const embed = GiveawayHandler_1.giveawayHandler.createGiveawayEmbed(Object.assign(Object.assign({}, giveawayData), { participants: [], paused: false }));
        const button = GiveawayHandler_1.giveawayHandler.createGiveawayButton();
        const giveawayMessage = yield interaction.reply({
            embeds: [embed],
            components: [button],
            fetchReply: true
        });
        if (giveawayMessage) {
            GiveawayHandler_1.giveawayHandler.createGiveaway(interaction.guildId, interaction.channelId, giveawayMessage.id, giveawayData);
        }
    });
}
function handleEnd(interaction) {
    return __awaiter(this, void 0, void 0, function* () {
        const messageId = interaction.options.getString('message_id', true);
        const giveaway = GiveawayHandler_1.giveawayHandler.getGiveawayByMessage(interaction.guildId, messageId);
        if (!giveaway) {
            const embed = new discord_js_1.EmbedBuilder().setColor(config.colors.error).setDescription(`${config.emojis.error} Giveaway not found. Check the Message ID.`);
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        if (giveaway.ended) {
            const embed = new discord_js_1.EmbedBuilder().setColor(config.colors.error).setDescription(`${config.emojis.error} This giveaway has already ended.`);
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        yield GiveawayHandler_1.giveawayHandler.endGiveaway(giveaway.id);
        const embed = embedStyle(interaction, 'Giveaway Ended', `${config.emojis.success} Successfully ended the giveaway for **${giveaway.prize}**.`);
        return interaction.reply({ embeds: [embed], ephemeral: true });
    });
}
function handleReroll(interaction) {
    return __awaiter(this, void 0, void 0, function* () {
        const messageId = interaction.options.getString('message_id', true);
        const giveaway = GiveawayHandler_1.giveawayHandler.getGiveawayByMessage(interaction.guildId, messageId);
        if (!giveaway) {
            const embed = new discord_js_1.EmbedBuilder().setColor(config.colors.error).setDescription(`${config.emojis.error} Giveaway not found.`);
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        if (!giveaway.ended) {
            const embed = new discord_js_1.EmbedBuilder().setColor(config.colors.error).setDescription(`${config.emojis.error} This giveaway has not ended yet.`);
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        yield GiveawayHandler_1.giveawayHandler.rerollGiveaway(giveaway.id, interaction.channel);
        const embed = embedStyle(interaction, 'Giveaway Rerolled', `${config.emojis.success} Successfully rerolled winners for **${giveaway.prize}**.`);
        return interaction.reply({ embeds: [embed], ephemeral: true });
    });
}
function handlePause(interaction) {
    return __awaiter(this, void 0, void 0, function* () {
        const messageId = interaction.options.getString('message_id', true);
        const giveaway = GiveawayHandler_1.giveawayHandler.getGiveawayByMessage(interaction.guildId, messageId);
        if (!giveaway) {
            const embed = new discord_js_1.EmbedBuilder().setColor(config.colors.error).setDescription(`${config.emojis.error} Giveaway not found.`);
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        const success = yield GiveawayHandler_1.giveawayHandler.pauseGiveaway(giveaway.id);
        if (success) {
            const embed = embedStyle(interaction, 'Giveaway Paused', `${config.emojis.success} Successfully paused the giveaway for **${giveaway.prize}**.`);
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        else {
            const embed = new discord_js_1.EmbedBuilder().setColor(config.colors.error).setDescription(`${config.emojis.error} Could not pause (already paused or ended).`);
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
    });
}
function handleResume(interaction) {
    return __awaiter(this, void 0, void 0, function* () {
        const messageId = interaction.options.getString('message_id', true);
        const giveaway = GiveawayHandler_1.giveawayHandler.getGiveawayByMessage(interaction.guildId, messageId);
        if (!giveaway) {
            const embed = new discord_js_1.EmbedBuilder().setColor(config.colors.error).setDescription(`${config.emojis.error} Giveaway not found.`);
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        const success = yield GiveawayHandler_1.giveawayHandler.resumeGiveaway(giveaway.id);
        if (success) {
            const embed = embedStyle(interaction, 'Giveaway Resumed', `${config.emojis.success} Successfully resumed the giveaway for **${giveaway.prize}**.`);
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        else {
            const embed = new discord_js_1.EmbedBuilder().setColor(config.colors.error).setDescription(`${config.emojis.error} Could not resume (not paused or ended).`);
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
    });
}
function handleList(interaction) {
    return __awaiter(this, void 0, void 0, function* () {
        const giveaways = GiveawayHandler_1.giveawayHandler.getAllGiveaways(interaction.guildId);
        if (giveaways.length === 0) {
            const embed = new discord_js_1.EmbedBuilder()
                .setColor(config.colors.warning)
                .setDescription(`${config.emojis.warning} No active giveaways found for this server.`)
                .setFooter({ text: `Requested by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        const list = giveaways.slice(0, 10).map(g => {
            return `**${config.emojis.dot} Prize:** ${g.prize}\n**ID:** \`${g.messageId}\` • **Status:** ${g.ended ? 'Ended' : g.paused ? 'Paused' : 'Running'}\n**Ends:** <t:${Math.floor(g.endTime / 1000)}:R>`;
        }).join('\n\n');
        const embed = embedStyle(interaction, 'Active Giveaways', list);
        return interaction.reply({ embeds: [embed] });
    });
}
