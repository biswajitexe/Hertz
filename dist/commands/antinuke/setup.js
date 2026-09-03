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
const componentV2_1 = require("../../utilities/componentV2");
exports.command = new discord_js_1.SlashCommandBuilder()
    .setName('antinuke')
    .setDescription('Configure the Advanced Antinuke System.')
    .addSubcommand(sub => sub
    .setName('enable')
    .setDescription('Enable the Antinuke system.'))
    .addSubcommand(sub => sub
    .setName('disable')
    .setDescription('Disable the Antinuke system.'))
    .addSubcommand(sub => sub
    .setName('show')
    .setDescription('View current Antinuke configuration.'));
function run(interaction, database) {
    return __awaiter(this, void 0, void 0, function* () {
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
        const isOwner = interaction.user.id === interaction.guild.ownerId;
        const isExtraOwner = guildData.extraOwners.includes(interaction.user.id);
        const isBotOwner = interaction.user.id === process.env.OWNER_ID;
        if (!isOwner && !isExtraOwner && !isBotOwner) {
            yield interaction.reply((0, componentV2_1.createErrorV2)('Only the Server Owner, Extra Owners, or Bot Owner can manage the Antinuke system.').toPayload({ ephemeral: true }));
            return;
        }
        const sub = interaction.options.getSubcommand();
        const embedStyle = (title, description, color = config.colors.primary) => {
            var _a;
            return new componentV2_1.V2Embed()
                .setColor(color)
                .setTitle(`${config.emojis.antinuke} ${title}`)
                .setDescription(description)
                .setThumbnail(((_a = interaction.client.user) === null || _a === void 0 ? void 0 : _a.displayAvatarURL()) || null)
                .setFooter(`Requested by ${interaction.user.username}`, interaction.user.displayAvatarURL());
        };
        if (sub === 'enable') {
            if (guildData.antinuke.enabled) {
                const embed = new componentV2_1.V2Embed()
                    .setColor(config.colors.error)
                    .setDescription(`${config.emojis.error} **Antinuke is already enabled!**`)
                    .setFooter(`Requested by ${interaction.user.username}`, interaction.user.displayAvatarURL());
                yield interaction.reply(embed.toPayload());
                return;
            }
            guildData.antinuke.enabled = true;
            let logChannel = interaction.guild.channels.cache.find(c => c.name === 'hertz-log' && c.type === discord_js_1.ChannelType.GuildText);
            if (!logChannel) {
                try {
                    logChannel = yield interaction.guild.channels.create({
                        name: 'hertz-log',
                        type: discord_js_1.ChannelType.GuildText,
                        permissionOverwrites: [
                            {
                                id: interaction.guild.id,
                                deny: [discord_js_1.PermissionFlagsBits.ViewChannel],
                            },
                            {
                                id: interaction.client.user.id,
                                allow: [discord_js_1.PermissionFlagsBits.ViewChannel, discord_js_1.PermissionFlagsBits.SendMessages, discord_js_1.PermissionFlagsBits.EmbedLinks],
                            },
                            {
                                id: interaction.user.id,
                                allow: [discord_js_1.PermissionFlagsBits.ViewChannel],
                            }
                        ],
                        reason: 'Auto-created for Antinuke Logging'
                    });
                }
                catch (e) {
                    console.error(e);
                }
            }
            if (logChannel) {
                guildData.antinuke.logChannelId = logChannel.id;
            }
            yield database.insertGuild(interaction.guild.id, guildData);
            const channelMsg = logChannel ? `\n<:1709locked:1461066037008269434> Log channel set to <#${logChannel.id}>.` : `\n⚠️ Could not create 'hertz-log'. Please set logs manually.`;
            const protections = [
                'Anti Ban', 'Anti Kick', 'Anti Prune', 'Anti Unban', 'Anti Bot Add',
                'Anti Role Create', 'Anti Role Delete', 'Anti Role Update',
                'Anti Channel Create', 'Anti Channel Delete',
                'Anti Server Update', 'Anti Vanity URL', 'Anti Webhook Update',
                'Anti Emoji Update', 'Anti Sticker Update', 'Anti Integration',
                'Anti AutoMod Rule', 'Anti Thread Create', 'Anti Thread Delete'
            ].map(p => `> ${config.emojis.success} ${p}`).join('\n');
            const embed = embedStyle('Antinuke Panel', `**Antinuke System Enabled.**\n\n**Active Protections:**\n${protections}\n${channelMsg}\n<:527192nikkiworking:1461069361115824168> **Note:** Keep my role on top with Admin perms.`);
            yield interaction.reply(embed.toPayload());
        }
        else if (sub === 'disable') {
            guildData.antinuke.enabled = false;
            yield database.insertGuild(interaction.guild.id, guildData);
            const protections = [
                'Anti Ban', 'Anti Kick', 'Anti Prune', 'Anti Unban', 'Anti Bot Add',
                'Anti Role Create', 'Anti Role Delete', 'Anti Role Update',
                'Anti Channel Create', 'Anti Channel Delete',
                'Anti Server Update', 'Anti Vanity URL', 'Anti Webhook Update',
                'Anti Emoji Update', 'Anti Sticker Update', 'Anti Integration',
                'Anti AutoMod Rule', 'Anti Thread Create', 'Anti Thread Delete'
            ].map(p => `> ${config.emojis.error} ${p}`).join('\n');
            const embed = embedStyle('Antinuke Panel', `**Antinuke System Disabled.**\n\n**Inactive Protections:**\n${protections}\n\n⚠️ **Your server is now vulnerable.**\nUse \`/antinuke enable\` to restore security.`, config.colors.error);
            yield interaction.reply(embed.toPayload());
        }
        else if (sub === 'show') {
            const logChannelId = guildData.antinuke.logChannelId;
            const channelMsg = logChannelId ? `\n<:1709locked:1461066037008269434> **Log Channel:** <#${logChannelId}>` : `\n${config.emojis.warning} Could not find 'hertz-log'. Please set logs manually.`;
            const statusEmoji = guildData.antinuke.enabled ? config.emojis.success : config.emojis.error;
            const protections = [
                'Anti Ban', 'Anti Kick', 'Anti Prune', 'Anti Unban', 'Anti Bot Add',
                'Anti Role Create', 'Anti Role Delete', 'Anti Role Update',
                'Anti Channel Create', 'Anti Channel Delete',
                'Anti Server Update', 'Anti Vanity URL', 'Anti Webhook Update',
                'Anti Emoji Update', 'Anti Sticker Update', 'Anti Integration',
                'Anti AutoMod Rule', 'Anti Thread Create', 'Anti Thread Delete'
            ].map(p => `> ${statusEmoji} ${p}`).join('\n');
            let description = `**Antinuke System ${guildData.antinuke.enabled ? "Enabled" : "Disabled"}.**\n\n**Active Protections:**\n${protections}`;
            if (guildData.antinuke.enabled) {
                description += `\n${channelMsg}\n<:527192nikkiworking:1461069361115824168> **Note:** Keep my role on top with Admin perms.`;
            }
            else {
                description += `\n\n**System is currently disabled.**\nUse \`${config.prefix}antinuke enable\` to activate security and protect your server! <:6581lockkey:1461100873479487559>`;
            }
            const embed = embedStyle('Antinuke Panel', description);
            yield interaction.reply(embed.toPayload());
        }
        else {
            const embed = embedStyle('Antinuke Commands', `\`${config.prefix}antinuke enable\`\n` +
                `\`${config.prefix}antinuke disable\`\n` +
                `\`${config.prefix}antinuke show\``);
            yield interaction.reply(embed.toPayload());
        }
    });
}
