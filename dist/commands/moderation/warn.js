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
const permission_1 = require("../../utilities/permission");
const modLogger_1 = require("../../utilities/modLogger");
const embedUtils_1 = require("../../utilities/embedUtils");
const config = __importStar(require("../../config"));
exports.command = new discord_js_1.SlashCommandBuilder()
    .setName('warn')
    .setDescription('Manage user warnings')
    .addSubcommand(subcommand => subcommand
    .setName('add')
    .setDescription('Issue a warning to a user')
    .addUserOption(option => option.setName('user').setDescription('The user to warn').setRequired(true))
    .addStringOption(option => option.setName('reason').setDescription('The reason for the warning').setRequired(false)))
    .addSubcommand(subcommand => subcommand
    .setName('list')
    .setDescription('View a user\'s warnings')
    .addUserOption(option => option.setName('user').setDescription('The user to check').setRequired(false)))
    .addSubcommand(subcommand => subcommand
    .setName('remove')
    .setDescription('Remove a specific warning')
    .addUserOption(option => option.setName('user').setDescription('The user to manage').setRequired(true))
    .addStringOption(option => option.setName('id').setDescription('The warning ID to remove').setRequired(true)))
    .addSubcommand(subcommand => subcommand
    .setName('clear')
    .setDescription('Clear all warnings for a user')
    .addUserOption(option => option.setName('user').setDescription('The user to reset').setRequired(true)));
function run(interaction, database) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        if (!interaction.inCachedGuild())
            return;
        const subcommand = interaction.options.getSubcommand();
        const user = interaction.options.getMember('user');
        const targetUser = interaction.options.getUser('user');
        if (!targetUser && subcommand !== 'list') {
            return interaction.reply({ embeds: [(0, embedUtils_1.createErrorEmbed)(interaction.user, "**Please provide a valid User.**\nUsage: `?warn <add|remove|list|clear> <user> ...`")], ephemeral: true });
        }
        if (subcommand === 'list') {
            const guildData = yield database.retrieveGuild(interaction.guild.id);
            if (targetUser) {
                const userWarns = ((_a = guildData === null || guildData === void 0 ? void 0 : guildData.warns) === null || _a === void 0 ? void 0 : _a[targetUser.id]) || [];
                if (userWarns.length === 0) {
                    return interaction.reply({ content: `${config.emojis.success} **${targetUser.username}** has no warnings.`, ephemeral: true });
                }
                const embed = new discord_js_1.EmbedBuilder()
                    .setColor(config.colors.primary)
                    .setAuthor({ name: `warnings list for ${targetUser.username}`, iconURL: 'https://cdn.discordapp.com/emojis/1461641597476274332.png' })
                    .setDescription(userWarns.map((w, index) => {
                    return `\`「${index + 1}」\` | \`${w.reason}\` - <t:${Math.floor(w.timestamp / 1000)}:R>`;
                }).join('\n'))
                    .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });
                return interaction.reply({ embeds: [embed] });
            }
            else {
                if (!guildData || !guildData.warns || Object.keys(guildData.warns).length === 0) {
                    return interaction.reply({ content: `${config.emojis.error} **No warnings found in this server.**`, ephemeral: true });
                }
                const warnedUsers = Object.entries(guildData.warns).filter(([_, warns]) => warns.length > 0);
                if (warnedUsers.length === 0) {
                    return interaction.reply({ content: `${config.emojis.error} **No active warnings found.**`, ephemeral: true });
                }
                const embed = new discord_js_1.EmbedBuilder()
                    .setColor(config.colors.primary)
                    .setAuthor({ name: `School Warn List`, iconURL: interaction.guild.iconURL() || undefined })
                    .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });
                const list = yield Promise.all(warnedUsers.map((_a, index_1) => __awaiter(this, [_a, index_1], void 0, function* ([userId, warns], index) {
                    let username = userId;
                    try {
                        const user = yield interaction.client.users.fetch(userId);
                        username = user.username;
                    }
                    catch (_b) {
                        username = 'Unknown User';
                    }
                    return `\`「${index + 1}」\` | \`${username} (${userId})\` - **${warns.length} Warns**`;
                })));
                embed.setDescription(list.join('\n').slice(0, 4000));
                return interaction.reply({ embeds: [embed] });
            }
        }
        if (subcommand === 'add') {
            const reason = interaction.options.getString('reason') || "No reason provided";
            if (!interaction.member.permissions.has(discord_js_1.PermissionFlagsBits.ModerateMembers) && interaction.user.id !== process.env.OWNER_ID) {
                return interaction.reply({ embeds: [(0, embedUtils_1.createErrorEmbed)(interaction.user, "**You do not have permission to warn members.**")], ephemeral: true });
            }
            if (!user || !(user instanceof discord_js_1.GuildMember)) {
                return interaction.reply({ embeds: [(0, embedUtils_1.createErrorEmbed)(interaction.user, "**User is not in the server.**")], ephemeral: true });
            }
            if (user.id === interaction.user.id) {
                return interaction.reply({ embeds: [(0, embedUtils_1.createErrorEmbed)(interaction.user, "**You cannot warn yourself.**")], ephemeral: true });
            }
            if (user.id === interaction.client.user.id) {
                return interaction.reply({ embeds: [(0, embedUtils_1.createErrorEmbed)(interaction.user, "**You cannot warn me.**")], ephemeral: true });
            }
            if (user.id === interaction.guild.ownerId) {
                return interaction.reply({ embeds: [(0, embedUtils_1.createErrorEmbed)(interaction.user, "**You cannot warn the server owner.**")], ephemeral: true });
            }
            if (!(0, permission_1.canModerate)(interaction.member, user, discord_js_1.PermissionFlagsBits.ModerateMembers)) {
                return interaction.reply({ embeds: [(0, embedUtils_1.createErrorEmbed)(interaction.user, "**You cannot warn this user due to role hierarchy.**")], ephemeral: true });
            }
            yield interaction.deferReply();
            try {
                const guildData = yield database.retrieveGuild(interaction.guild.id);
                if (!guildData)
                    return interaction.editReply({ content: "Database error." });
                if (!guildData.warns)
                    guildData.warns = {};
                if (!guildData.warns[user.id])
                    guildData.warns[user.id] = [];
                const warnId = Math.random().toString(36).substring(2, 10).toUpperCase();
                guildData.warns[user.id].push({
                    id: warnId,
                    moderatorId: interaction.user.id,
                    reason: reason,
                    timestamp: Date.now()
                });
                yield database.insertGuild(interaction.guild.id, guildData);
                const extraInfo = `**Warn ID**: \`${warnId}\`\n**Total Warns**: ${guildData.warns[user.id].length}`;
                yield (0, modLogger_1.logAction)(interaction.guild, user.user, interaction.user, 'WARN', reason, database, extraInfo);
                const successEmbed = (0, embedUtils_1.createSuccessEmbed)(interaction.user, `**Warned ${user.user.tag}**`)
                    .addFields({ name: 'Reason', value: reason, inline: false }, { name: 'Total Warns', value: `${guildData.warns[user.id].length}`, inline: true });
                return interaction.editReply({ embeds: [successEmbed] });
            }
            catch (error) {
                console.error(error);
                return interaction.editReply({ embeds: [(0, embedUtils_1.createErrorEmbed)(interaction.user, "**Failed to warn user.**")] });
            }
        }
        if (subcommand === 'remove') {
            const warnId = interaction.options.getString('id', true);
            if (!targetUser)
                return;
            const guildData = yield database.retrieveGuild(interaction.guild.id);
            if (!guildData || !guildData.warns || !guildData.warns[targetUser.id]) {
                return interaction.reply({ content: `${config.emojis.error} This user has no warnings.`, ephemeral: true });
            }
            const initialLength = guildData.warns[targetUser.id].length;
            guildData.warns[targetUser.id] = guildData.warns[targetUser.id].filter(w => w.id !== warnId);
            if (guildData.warns[targetUser.id].length === initialLength) {
                return interaction.reply({ content: `${config.emojis.error} Warning ID \`${warnId}\` not found for this user.`, ephemeral: true });
            }
            yield database.insertGuild(interaction.guild.id, guildData);
            const embed = new discord_js_1.EmbedBuilder()
                .setColor(0x57F287)
                .setDescription(`${config.emojis.success} **Warning Deleted**\n${config.emojis.dot} **Target:** ${targetUser.tag}\n${config.emojis.dot} **ID:** ${warnId}`);
            return interaction.reply({ embeds: [embed] });
        }
        if (subcommand === 'clear') {
            if (!targetUser)
                return;
            const guildData = yield database.retrieveGuild(interaction.guild.id);
            if (!guildData || !guildData.warns || !guildData.warns[targetUser.id] || guildData.warns[targetUser.id].length === 0) {
                return interaction.reply({ content: `${config.emojis.error} This user has no warnings to clear.`, ephemeral: true });
            }
            const count = guildData.warns[targetUser.id].length;
            delete guildData.warns[targetUser.id];
            yield database.insertGuild(interaction.guild.id, guildData);
            const embed = new discord_js_1.EmbedBuilder()
                .setColor(0x57F287)
                .setDescription(`${config.emojis.success} Cleared **${count}** warnings for **${targetUser.tag}**.`);
            return interaction.reply({ embeds: [embed] });
        }
    });
}
