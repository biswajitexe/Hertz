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
    .setName('media')
    .setDescription('Manage media-only channels')
    .addSubcommand(subcommand => subcommand
    .setName('setup')
    .setDescription('Set a channel as media-only')
    .addChannelOption(option => option.setName('channel')
    .setDescription('The channel to configure')
    .addChannelTypes(discord_js_1.ChannelType.GuildText)
    .setRequired(true)))
    .addSubcommand(subcommand => subcommand
    .setName('remove')
    .setDescription('Remove media-only restriction')
    .addChannelOption(option => option.setName('channel')
    .setDescription('The channel to remove restriction from')
    .addChannelTypes(discord_js_1.ChannelType.GuildText)
    .setRequired(true)))
    .addSubcommand(subcommand => subcommand
    .setName('show')
    .setDescription('Show all media-only channels'));
function run(interaction, database) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        if (!interaction.guild)
            return;
        if (!((_a = interaction.memberPermissions) === null || _a === void 0 ? void 0 : _a.has(discord_js_1.PermissionFlagsBits.ManageChannels)) && interaction.user.id !== process.env.OWNER_ID) {
            return interaction.reply((0, componentV2_1.createErrorV2)('You do not have permission to manage channels.').toPayload({ ephemeral: true }));
        }
        const sub = interaction.options.getSubcommand(false);
        const guildId = interaction.guildId;
        let guildData = yield database.retrieveGuild(guildId);
        if (!guildData) {
            yield database.defaultGuild(interaction.guild);
            guildData = yield database.retrieveGuild(guildId);
            if (!guildData)
                return;
        }
        const embedStyle = (title, description) => {
            var _a;
            return new componentV2_1.V2Embed()
                .setColor(config.colors.primary)
                .setTitle(`<:7291mediaadd:1464533585477374107> ${title}`)
                .setDescription(description)
                .setThumbnail(((_a = interaction.client.user) === null || _a === void 0 ? void 0 : _a.displayAvatarURL()) || null)
                .setFooter(`Requested by ${interaction.user.username}`, interaction.user.displayAvatarURL());
        };
        if (sub === 'setup') {
            const channel = interaction.options.getChannel('channel', true);
            if (guildData.mediaChannels.includes(channel.id)) {
                const embed = new componentV2_1.V2Embed()
                    .setColor(config.colors.error)
                    .setDescription(`${config.emojis.error} <#${channel.id}> is already configured as a media-only channel.`)
                    .setFooter(`Requested by ${interaction.user.username}`, interaction.user.displayAvatarURL());
                return interaction.reply(embed.toPayload({ ephemeral: true }));
            }
            guildData.mediaChannels.push(channel.id);
            yield database.insertGuild(guildId, guildData);
            const embed = embedStyle('Media Channels', `${config.emojis.success} Successfully configured <#${channel.id}> as a media-only channel.\n\n<:527192nikkiworking:1461069361115824168> **Note:** Only images and links can be sent here.`);
            return interaction.reply(embed.toPayload());
        }
        else if (sub === 'remove') {
            const channel = interaction.options.getChannel('channel', true);
            if (!guildData.mediaChannels.includes(channel.id)) {
                const embed = new componentV2_1.V2Embed()
                    .setColor(config.colors.error)
                    .setDescription(`${config.emojis.error} <#${channel.id}> is not configured as a media-only channel.`)
                    .setFooter(`Requested by ${interaction.user.username}`, interaction.user.displayAvatarURL());
                return interaction.reply(embed.toPayload({ ephemeral: true }));
            }
            guildData.mediaChannels = guildData.mediaChannels.filter(id => id !== channel.id);
            yield database.insertGuild(guildId, guildData);
            const embed = embedStyle('Media Channels', `${config.emojis.success} Successfully removed the media-only restriction from <#${channel.id}>.`);
            return interaction.reply(embed.toPayload());
        }
        else if (sub === 'show') {
            if (guildData.mediaChannels.length === 0) {
                const embed = new componentV2_1.V2Embed()
                    .setColor(config.colors.error)
                    .setDescription(`${config.emojis.warning} No media-only channels have been configured on this server.`)
                    .setFooter(`Requested by ${interaction.user.username}`, interaction.user.displayAvatarURL());
                return interaction.reply(embed.toPayload());
            }
            const channelList = guildData.mediaChannels
                .map(id => `${config.emojis.dot || "•"} <#${id}>`)
                .join("\n");
            const embed = embedStyle('Configured Media Channels', channelList + `\n\n<:527192nikkiworking:1461069361115824168> **Note:** Only users with \`Manage Messages\` can bypass restriction.`);
            return interaction.reply(embed.toPayload());
        }
        else {
            const embed = embedStyle('Media Commands', `\`${config.prefix}media setup <#channel>\`\n` +
                `\`${config.prefix}media remove <#channel>\`\n` +
                `\`${config.prefix}media show\``);
            return interaction.reply(embed.toPayload());
        }
    });
}
