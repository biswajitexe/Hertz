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
Object.defineProperty(exports, "__esModule", { value: true });
exports.command = void 0;
exports.run = run;
const discord_js_1 = require("discord.js");
const config = __importStar(require("../../config"));
exports.command = new discord_js_1.SlashCommandBuilder()
    .setName('antieveryone')
    .setDescription('Configure the anti-everyone/here system.')
    .addSubcommand(subcommand => subcommand
    .setName('enable')
    .setDescription('Enable the anti-everyone filter.'))
    .addSubcommand(subcommand => subcommand
    .setName('disable')
    .setDescription('Disable the anti-everyone filter.'))
    .addSubcommand(subcommand => subcommand
    .setName('status')
    .setDescription('Check the current status of the anti-everyone filter.'));
function run(interaction, database) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        if (!interaction.inCachedGuild())
            return;
        let guildData = yield database.retrieveGuild(interaction.guild.id);
        if (!guildData) {
            yield database.defaultGuild(interaction.guild);
            guildData = yield database.retrieveGuild(interaction.guild.id);
        }
        if (!guildData)
            return;
        if (!guildData.extraOwners)
            guildData.extraOwners = [];
        if (!guildData.extraAdmins)
            guildData.extraAdmins = [];
        const isOwner = interaction.user.id === interaction.guild.ownerId;
        const isExtraOwner = guildData.extraOwners.includes(interaction.user.id);
        const isExtraAdmin = guildData.extraAdmins.includes(interaction.user.id);
        const isBotOwner = interaction.user.id === process.env.OWNER_ID;
        if (!isOwner && !isExtraOwner && !isExtraAdmin && !isBotOwner) {
            yield interaction.reply({ content: `${config.emojis.error} **Only the Server Owner, Trustable Admins, or Bot Owner can manage anti-everyone settings.**`, ephemeral: true });
            return;
        }
        const sub = interaction.options.getSubcommand();
        yield interaction.deferReply();
        try {
            if (sub === 'enable') {
                if (guildData.messageFilters.antiEveryone) {
                    yield interaction.editReply({ content: `${config.emojis.error} **Anti-Everyone is already enabled!**` });
                    return;
                }
                guildData.messageFilters.antiEveryone = true;
                yield database.insertGuild(interaction.guild.id, guildData);
                yield interaction.editReply({ content: `${config.emojis.success} **Anti-Everyone filter has been Enabled.**` });
            }
            else if (sub === 'disable') {
                if (!guildData.messageFilters.antiEveryone) {
                    yield interaction.editReply({ content: `${config.emojis.error} **Anti-Everyone is already disabled!**` });
                    return;
                }
                guildData.messageFilters.antiEveryone = false;
                yield database.insertGuild(interaction.guild.id, guildData);
                yield interaction.editReply({ content: `${config.emojis.success} **Anti-Everyone filter has been DISABLED.**` });
            }
            else if (sub === 'status') {
                const statusEmoji = guildData.messageFilters.antiEveryone ? config.emojis.success : config.emojis.error;
                const statusText = guildData.messageFilters.antiEveryone ? "Enabled" : "Disabled";
                let description = `**Anti-Everyone System ${statusText}.**\n\n**Active Protections:**\n> ${statusEmoji} Anti-Everyone/Here`;
                if (!guildData.messageFilters.antiEveryone) {
                    description += `\n\n**System is currently disabled.**\nUse \`${config.prefix}antieveryone enable\` to activate security and protect your server! <:6581lockkey:1461100873479487559>`;
                }
                const embed = new discord_js_1.EmbedBuilder()
                    .setColor(config.colors.primary)
                    .setDescription(`**${config.emojis.automod} Anti-Everyone Panel**\n\n${description}`)
                    .setThumbnail(((_a = interaction.client.user) === null || _a === void 0 ? void 0 : _a.displayAvatarURL()) || null)
                    .setFooter({ text: `Requested by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });
                yield interaction.editReply({ embeds: [embed] });
            }
            else {
                const embed = new discord_js_1.EmbedBuilder()
                    .setColor(config.colors.primary)
                    .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
                    .setDescription('`?antieveryone enable`\n' +
                    '`?antieveryone disable`\n' +
                    '`?antieveryone status`')
                    .setThumbnail(((_b = interaction.client.user) === null || _b === void 0 ? void 0 : _b.displayAvatarURL()) || null)
                    .setFooter({ text: 'Xeon • Automated Security', iconURL: ((_c = interaction.client.user) === null || _c === void 0 ? void 0 : _c.displayAvatarURL()) || undefined });
                yield interaction.editReply({ embeds: [embed] });
            }
        }
        catch (error) {
            console.error(error);
            yield interaction.editReply({ content: `${config.emojis.error} **Failed to update settings.**` });
        }
    });
}
