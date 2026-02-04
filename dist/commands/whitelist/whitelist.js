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
exports.command = exports.aliases = void 0;
exports.run = run;
const discord_js_1 = require("discord.js");
const config = __importStar(require("../../config"));
exports.aliases = ['wl'];
exports.command = new discord_js_1.SlashCommandBuilder()
    .setName('whitelist')
    .setDescription('Manage whitelists for protections.')
    .addSubcommand(sub => sub
    .setName('add')
    .setDescription('Add a user, role, or channel to a whitelist.')
    .addStringOption(opt => opt
    .setName('category')
    .setDescription('The category to whitelist in (Default: All)')
    .setRequired(false)
    .addChoices({ name: 'All (Everything)', value: 'all' }, { name: 'Anti-Link', value: 'links' }, { name: 'Anti-Invite', value: 'invites' }, { name: 'Anti-Spam', value: 'spam' }))
    .addUserOption(opt => opt.setName('user').setDescription('User to whitelist'))
    .addRoleOption(opt => opt.setName('role').setDescription('Role to whitelist'))
    .addChannelOption(opt => opt.setName('channel').setDescription('Channel to whitelist')))
    .addSubcommand(sub => sub
    .setName('remove')
    .setDescription('Remove a user, role, or channel from a whitelist.')
    .addStringOption(opt => opt
    .setName('category')
    .setDescription('The category to remove from (Default: All)')
    .setRequired(false)
    .addChoices({ name: 'All (Everything)', value: 'all' }, { name: 'Anti-Link', value: 'links' }, { name: 'Anti-Invite', value: 'invites' }, { name: 'Anti-Spam', value: 'spam' }))
    .addUserOption(opt => opt.setName('user').setDescription('User to remove'))
    .addRoleOption(opt => opt.setName('role').setDescription('Role to remove'))
    .addChannelOption(opt => opt.setName('channel').setDescription('Channel to remove')))
    .addSubcommand(sub => sub
    .setName('show')
    .setDescription('View the current whitelist for a category.')
    .addStringOption(opt => opt
    .setName('category')
    .setDescription('The category to view (Default: All)')
    .setRequired(false)
    .addChoices({ name: 'Anti-Link', value: 'links' }, { name: 'Anti-Invite', value: 'invites' }, { name: 'Anti-Spam', value: 'spam' })))
    .addSubcommand(sub => sub
    .setName('reset')
    .setDescription('Reset whitelist for a category.')
    .addStringOption(opt => opt
    .setName('category')
    .setDescription('The category to reset (Default: All)')
    .setRequired(false)
    .addChoices({ name: 'All (Everything)', value: 'all' }, { name: 'Anti-Link', value: 'links' }, { name: 'Anti-Invite', value: 'invites' }, { name: 'Anti-Spam', value: 'spam' })));
function run(interaction, database) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        if (!interaction.guild)
            return;
        if (!interaction.member || typeof interaction.member.permissions === 'string' || !interaction.member.permissions.has(discord_js_1.PermissionFlagsBits.ManageGuild)) {
            yield interaction.reply({ content: `${config.emojis.error} ** You do not have permission to manage server whitelist.** `, ephemeral: true });
            return;
        }
        let sub = null;
        let category = null;
        try {
            sub = interaction.options.getSubcommand();
            category = interaction.options.getString('category');
        }
        catch (e) { }
        if (!category)
            category = 'all';
        const validCategories = ['all', 'links', 'invites', 'spam'];
        if (!sub || !category || !validCategories.includes(category)) {
            const msg = interaction;
            if (msg.content) {
                const args = msg.content.trim().split(/ +/);
                const action = (_a = args[1]) === null || _a === void 0 ? void 0 : _a.toLowerCase();
                const possibleTarget = args[2] || args[1];
                if (action === 'show' || action === 'list') {
                    try {
                        const guildData = yield database.retrieveGuild(interaction.guild.id);
                        if (!guildData) {
                            yield interaction.reply({ content: `${config.emojis.error} **Database error.**` });
                            return;
                        }
                        if (!guildData.messageFilters) {
                            guildData.messageFilters = {
                                linksWhitelist: { users: [], roles: [], channels: [] },
                                invitesWhitelist: { users: [], roles: [], channels: [] },
                                spamWhitelist: { users: [], roles: [], channels: [] }
                            };
                        }
                        const l = guildData.messageFilters.linksWhitelist || { users: [], roles: [], channels: [] };
                        const i = guildData.messageFilters.invitesWhitelist || { users: [], roles: [], channels: [] };
                        const s = guildData.messageFilters.spamWhitelist || { users: [], roles: [], channels: [] };
                        const userIds = new Set([...l.users, ...i.users, ...s.users]);
                        const roleIds = new Set([...l.roles, ...i.roles, ...s.roles]);
                        const channelIds = new Set([...l.channels, ...i.channels, ...s.channels]);
                        const getEmbed = (type) => __awaiter(this, void 0, void 0, function* () {
                            const embed = new discord_js_1.EmbedBuilder()
                                .setColor(config.colors.primary)
                                .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });
                            if (type === 'users') {
                                embed.setAuthor({ name: 'whitelist users', iconURL: 'https://cdn.discordapp.com/emojis/1461641597476274332.png' });
                                const ids = Array.from(userIds);
                                const names = yield Promise.all(ids.map((id) => __awaiter(this, void 0, void 0, function* () {
                                    try {
                                        const user = yield interaction.client.users.fetch(id);
                                        return user.username;
                                    }
                                    catch (_a) {
                                        return `Unknown (${id})`;
                                    }
                                })));
                                const list = names.map((name, i) => `\`「${i + 1}」\` | \`${name}「${ids[i]}」\``).join('\n');
                                embed.setDescription(list.length > 0 ? list.slice(0, 4000) : "**No users whitelisted.**");
                            }
                            else if (type === 'roles') {
                                embed.setAuthor({ name: 'whitelist roles', iconURL: 'https://cdn.discordapp.com/emojis/1461641597476274332.png' });
                                const list = Array.from(roleIds).map((id, i) => `${i + 1}. <@&${id}>`).join('\n');
                                embed.setDescription(list.length > 0 ? list.slice(0, 4000) : "**No roles whitelisted.**");
                            }
                            else if (type === 'channels') {
                                embed.setAuthor({ name: 'whitelist channels', iconURL: 'https://cdn.discordapp.com/emojis/1461641597476274332.png' });
                                const list = Array.from(channelIds).map((id, i) => `${i + 1}. <#${id}>`).join('\n');
                                embed.setDescription(list.length > 0 ? list.slice(0, 4000) : "**No channels whitelisted.**");
                            }
                            return embed;
                        });
                        const row = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId('wl_show_users').setLabel('Users').setStyle(discord_js_1.ButtonStyle.Secondary).setEmoji(config.emojis.user), new discord_js_1.ButtonBuilder().setCustomId('wl_show_roles').setLabel('Roles').setStyle(discord_js_1.ButtonStyle.Secondary).setEmoji('<:64851purpleshield:1461677014367998153>'), new discord_js_1.ButtonBuilder().setCustomId('wl_show_channels').setLabel('Channels').setStyle(discord_js_1.ButtonStyle.Secondary).setEmoji(config.emojis.general));
                        const reply = yield interaction.reply({ embeds: [yield getEmbed('users')], components: [row] });
                        const collector = reply.createMessageComponentCollector({ componentType: discord_js_1.ComponentType.Button, time: 60000 });
                        collector.on('collect', (i) => __awaiter(this, void 0, void 0, function* () {
                            if (i.user.id !== interaction.user.id) {
                                yield i.reply({ content: `${config.emojis.error} **Only the requester can use these buttons.**`, ephemeral: true });
                                return;
                            }
                            if (i.customId === 'wl_show_users')
                                yield i.update({ embeds: [yield getEmbed('users')] });
                            else if (i.customId === 'wl_show_roles')
                                yield i.update({ embeds: [yield getEmbed('roles')] });
                            else if (i.customId === 'wl_show_channels')
                                yield i.update({ embeds: [yield getEmbed('channels')] });
                        }));
                        collector.on('end', () => {
                            const disabledRow = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId('wl_show_users').setLabel('Users').setStyle(discord_js_1.ButtonStyle.Secondary).setDisabled(true).setEmoji(config.emojis.user), new discord_js_1.ButtonBuilder().setCustomId('wl_show_roles').setLabel('Roles').setStyle(discord_js_1.ButtonStyle.Secondary).setDisabled(true).setEmoji('<:64851purpleshield:1461677014367998153>'), new discord_js_1.ButtonBuilder().setCustomId('wl_show_channels').setLabel('Channels').setStyle(discord_js_1.ButtonStyle.Secondary).setDisabled(true).setEmoji(config.emojis.general));
                            reply.edit({ components: [disabledRow] }).catch(() => { });
                        });
                        return;
                    }
                    catch (err) {
                        console.error("Error in whitelist show prefix:", err);
                        yield interaction.reply({ content: `Debug: ${err}` });
                        return;
                    }
                }
                if (action === 'reset') {
                    const categoryInput = (possibleTarget === null || possibleTarget === void 0 ? void 0 : possibleTarget.toLowerCase()) || 'all';
                    const valid = ['all', 'links', 'invites', 'spam'];
                    if (!valid.includes(categoryInput)) {
                        yield interaction.reply({ content: `${config.emojis.error} **Invalid category. Valid categories: ${valid.join(', ')}**` });
                        return;
                    }
                    const guildData = yield database.retrieveGuild(interaction.guild.id);
                    if (guildData) {
                        if (!guildData.messageFilters) {
                            yield interaction.reply({ content: `${config.emojis.warning} **Whitelist is already empty for category: ${categoryInput}.**` });
                            return;
                        }
                        const targetKeys = [];
                        if (categoryInput === 'all') {
                            targetKeys.push('linksWhitelist', 'invitesWhitelist', 'spamWhitelist');
                        }
                        else if (categoryInput === 'links')
                            targetKeys.push('linksWhitelist');
                        else if (categoryInput === 'invites')
                            targetKeys.push('invitesWhitelist');
                        else if (categoryInput === 'spam')
                            targetKeys.push('spamWhitelist');
                        let changeCount = 0;
                        for (const key of targetKeys) {
                            const list = guildData.messageFilters[key];
                            if (list && (list.users.length > 0 || list.roles.length > 0 || list.channels.length > 0)) {
                                guildData.messageFilters[key] = { users: [], roles: [], channels: [] };
                                changeCount++;
                            }
                        }
                        if (changeCount > 0) {
                            yield database.insertGuild(interaction.guild.id, guildData);
                            yield interaction.reply({ content: `${config.emojis.success} **Successfully reset whitelist for category: ${categoryInput}.**` });
                        }
                        else {
                            yield interaction.reply({ content: `${config.emojis.warning} **Whitelist is already empty for category: ${categoryInput}.**` });
                        }
                    }
                    return;
                }
                let targetId = '';
                let commandMode = 'add';
                if (action === 'remove' || action === 'delete') {
                    commandMode = 'remove';
                    targetId = possibleTarget ? possibleTarget.replace(/[<@!&#>]/g, '') : '';
                }
                else if (action === 'add') {
                    commandMode = 'add';
                    targetId = possibleTarget ? possibleTarget.replace(/[<@!&#>]/g, '') : '';
                }
                else {
                    targetId = action ? action.replace(/[<@!&#>]/g, '') : '';
                }
                if (/^\d{17,19}$/.test(targetId)) {
                    let type = null;
                    try {
                        if (yield interaction.guild.members.fetch(targetId).catch(() => null))
                            type = 'users';
                    }
                    catch (_b) { }
                    if (!type)
                        try {
                            if (yield interaction.guild.roles.fetch(targetId))
                                type = 'roles';
                        }
                        catch (_c) { }
                    if (!type)
                        try {
                            if (yield interaction.guild.channels.fetch(targetId))
                                type = 'channels';
                        }
                        catch (_d) { }
                    if (type) {
                        const guildData = yield database.retrieveGuild(interaction.guild.id);
                        if (guildData) {
                            if (!guildData.messageFilters)
                                guildData.messageFilters = { linksWhitelist: { users: [], roles: [], channels: [] }, invitesWhitelist: { users: [], roles: [], channels: [] }, spamWhitelist: { users: [], roles: [], channels: [] } };
                            if (!guildData.messageFilters.linksWhitelist)
                                guildData.messageFilters.linksWhitelist = { users: [], roles: [], channels: [] };
                            if (!guildData.messageFilters.invitesWhitelist)
                                guildData.messageFilters.invitesWhitelist = { users: [], roles: [], channels: [] };
                            if (!guildData.messageFilters.spamWhitelist)
                                guildData.messageFilters.spamWhitelist = { users: [], roles: [], channels: [] };
                            const lists = ['linksWhitelist', 'invitesWhitelist', 'spamWhitelist'];
                            let changeCount = 0;
                            for (const key of lists) {
                                const list = guildData.messageFilters[key][type];
                                if (commandMode === 'add') {
                                    if (!list.includes(targetId)) {
                                        list.push(targetId);
                                        changeCount++;
                                    }
                                }
                                else {
                                    if (list.includes(targetId)) {
                                        const index = list.indexOf(targetId);
                                        if (index > -1) {
                                            list.splice(index, 1);
                                            changeCount++;
                                        }
                                    }
                                }
                            }
                            if (changeCount > 0) {
                                yield database.insertGuild(interaction.guild.id, guildData);
                                yield interaction.reply({ content: `${config.emojis.success} **Successfully ${commandMode === 'add' ? 'added' : 'removed'} <@${type === 'roles' ? '&' : type === 'channels' ? '#' : ''}${targetId}> ${commandMode === 'add' ? 'to' : 'from'} Master Whitelist.**` });
                            }
                            else {
                                const typeName = type === 'users' ? 'User' : type === 'roles' ? 'Role' : 'Channel';
                                yield interaction.reply({ content: `${config.emojis.warning} **${typeName} was ${commandMode === 'add' ? 'already in' : 'not found in'} Master Whitelist.**` });
                            }
                            return;
                        }
                    }
                }
            }
            const helpEmbed = new discord_js_1.EmbedBuilder()
                .setColor(config.colors.primary)
                .setTitle('<:4497kazuhawaiter:1461641597476274332> whitelist command')
                .setDescription('\`?wl add <user>\`\n\`?wl remove <user>\`\n\`?wl show\`\n\`?wl reset all\`')
                .setThumbnail(interaction.client.user.displayAvatarURL())
                .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });
            yield interaction.reply({ embeds: [helpEmbed] });
            return;
        }
        const user = interaction.options.getUser('user');
        const role = interaction.options.getRole('role');
        const channel = interaction.options.getChannel('channel');
        yield interaction.deferReply();
        try {
            const guildData = yield database.retrieveGuild(interaction.guild.id);
            if (!guildData) {
                yield interaction.editReply({ content: `${config.emojis.error} **Database error.**` });
                return;
            }
            if (!guildData.messageFilters) {
                guildData.messageFilters = {
                    linksWhitelist: { users: [], roles: [], channels: [] },
                    invitesWhitelist: { users: [], roles: [], channels: [] },
                    spamWhitelist: { users: [], roles: [], channels: [] }
                };
            }
            if (!guildData.messageFilters.linksWhitelist)
                guildData.messageFilters.linksWhitelist = { users: [], roles: [], channels: [] };
            if (!guildData.messageFilters.invitesWhitelist)
                guildData.messageFilters.invitesWhitelist = { users: [], roles: [], channels: [] };
            if (!guildData.messageFilters.spamWhitelist)
                guildData.messageFilters.spamWhitelist = { users: [], roles: [], channels: [] };
            const targetKeys = [];
            if (category === 'all') {
                targetKeys.push('linksWhitelist', 'invitesWhitelist', 'spamWhitelist');
            }
            else if (category === 'links') {
                targetKeys.push('linksWhitelist');
            }
            else if (category === 'invites') {
                targetKeys.push('invitesWhitelist');
            }
            else if (category === 'spam') {
                targetKeys.push('spamWhitelist');
            }
            if (sub === 'add') {
                if (!user && !role && !channel) {
                    yield interaction.editReply({ content: `${config.emojis.error} **Please provide a user, role, or channel to whitelist.**` });
                    return;
                }
                const added = [];
                for (const key of targetKeys) {
                    const list = guildData.messageFilters[key];
                    if (user && !list.users.includes(user.id)) {
                        list.users.push(user.id);
                        added.push(`[${key.replace('Whitelist', '')}] User: ${user.tag}`);
                    }
                    if (role && !list.roles.includes(role.id)) {
                        list.roles.push(role.id);
                        added.push(`[${key.replace('Whitelist', '')}] Role: ${role.name}`);
                    }
                    if (channel && !list.channels.includes(channel.id)) {
                        list.channels.push(channel.id);
                        added.push(`[${key.replace('Whitelist', '')}] Channel: ${channel.name}`);
                    }
                }
                if (added.length === 0) {
                    yield interaction.editReply({ content: `${config.emojis.warning} **Selected items are already whitelisted in the selected specific category(s).**` });
                    return;
                }
                yield database.insertGuild(interaction.guild.id, guildData);
                const summary = userIdSummary(added);
                yield interaction.editReply({ content: `${config.emojis.success} **Whitelisted Added:**\n${summary}` });
            }
            else if (sub === 'remove') {
                if (!user && !role && !channel) {
                    yield interaction.editReply({ content: `${config.emojis.error} **Please provide a user, role, or channel to remove.**` });
                    return;
                }
                const removed = [];
                for (const key of targetKeys) {
                    const list = guildData.messageFilters[key];
                    if (user && list.users.includes(user.id)) {
                        guildData.messageFilters[key].users = list.users.filter(id => id !== user.id);
                        removed.push(`[${key.replace('Whitelist', '')}] User: ${user.tag}`);
                    }
                    if (role && list.roles.includes(role.id)) {
                        guildData.messageFilters[key].roles = list.roles.filter(id => id !== role.id);
                        removed.push(`[${key.replace('Whitelist', '')}] Role: ${role.name}`);
                    }
                    if (channel && list.channels.includes(channel.id)) {
                        guildData.messageFilters[key].channels = list.channels.filter(id => id !== channel.id);
                        removed.push(`[${key.replace('Whitelist', '')}] Channel: ${channel.name}`);
                    }
                }
                if (removed.length === 0) {
                    yield interaction.editReply({ content: `${config.emojis.warning} **Selected items were not in the whitelist.**` });
                    return;
                }
                yield database.insertGuild(interaction.guild.id, guildData);
                const summary = userIdSummary(removed);
                yield interaction.editReply({ content: `${config.emojis.success} **Whitelisted Removed:**\n${summary}` });
            }
            else if (sub === 'show') {
                const userIds = new Set();
                const roleIds = new Set();
                const channelIds = new Set();
                for (const key of targetKeys) {
                    const list = guildData.messageFilters[key];
                    list.users.forEach(id => userIds.add(id));
                    list.roles.forEach(id => roleIds.add(id));
                    list.channels.forEach(id => channelIds.add(id));
                }
                const getEmbed = (type) => __awaiter(this, void 0, void 0, function* () {
                    const embed = new discord_js_1.EmbedBuilder()
                        .setColor(config.colors.primary)
                        .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });
                    if (type === 'users') {
                        embed.setAuthor({ name: 'whitelist users', iconURL: 'https://cdn.discordapp.com/emojis/1461641597476274332.png' });
                        const ids = Array.from(userIds);
                        const names = yield Promise.all(ids.map((id) => __awaiter(this, void 0, void 0, function* () {
                            try {
                                const user = yield interaction.client.users.fetch(id);
                                return user.username;
                            }
                            catch (_a) {
                                return `Unknown (${id})`;
                            }
                        })));
                        const list = names.map((name, i) => `\`「${i + 1}」\` | \`${name}「${ids[i]}」\``).join('\n');
                        embed.setDescription(list.length > 0 ? list.slice(0, 4000) : "**No users whitelisted.**");
                    }
                    else if (type === 'roles') {
                        embed.setAuthor({ name: 'whitelist roles', iconURL: 'https://cdn.discordapp.com/emojis/1461641597476274332.png' });
                        const list = Array.from(roleIds).map((id, i) => `${i + 1}. <@&${id}>`).join('\n');
                        embed.setDescription(list.length > 0 ? list.slice(0, 4000) : "**No roles whitelisted.**");
                    }
                    else if (type === 'channels') {
                        embed.setAuthor({ name: 'whitelist channels', iconURL: 'https://cdn.discordapp.com/emojis/1461641597476274332.png' });
                        const list = Array.from(channelIds).map((id, i) => `${i + 1}. <#${id}>`).join('\n');
                        embed.setDescription(list.length > 0 ? list.slice(0, 4000) : "**No channels whitelisted.**");
                    }
                    return embed;
                });
                const row = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId('wl_show_users').setLabel('Users').setStyle(discord_js_1.ButtonStyle.Secondary).setEmoji(config.emojis.user), new discord_js_1.ButtonBuilder().setCustomId('wl_show_roles').setLabel('Roles').setStyle(discord_js_1.ButtonStyle.Secondary).setEmoji('<:64851purpleshield:1461677014367998153>'), new discord_js_1.ButtonBuilder().setCustomId('wl_show_channels').setLabel('Channels').setStyle(discord_js_1.ButtonStyle.Secondary).setEmoji(config.emojis.general));
                const reply = yield interaction.editReply({ embeds: [yield getEmbed('users')], components: [row] });
                const collector = reply.createMessageComponentCollector({ componentType: discord_js_1.ComponentType.Button, time: 60000 });
                collector.on('collect', (i) => __awaiter(this, void 0, void 0, function* () {
                    if (i.user.id !== interaction.user.id) {
                        yield i.reply({ content: `${config.emojis.error} **Only the requester can use these buttons.**`, ephemeral: true });
                        return;
                    }
                    if (i.customId === 'wl_show_users')
                        yield i.update({ embeds: [yield getEmbed('users')] });
                    else if (i.customId === 'wl_show_roles')
                        yield i.update({ embeds: [yield getEmbed('roles')] });
                    else if (i.customId === 'wl_show_channels')
                        yield i.update({ embeds: [yield getEmbed('channels')] });
                }));
                collector.on('end', () => {
                    const disabledRow = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId('wl_show_users').setLabel('Users').setStyle(discord_js_1.ButtonStyle.Secondary).setDisabled(true).setEmoji(config.emojis.user), new discord_js_1.ButtonBuilder().setCustomId('wl_show_roles').setLabel('Roles').setStyle(discord_js_1.ButtonStyle.Secondary).setDisabled(true).setEmoji('<:64851purpleshield:1461677014367998153>'), new discord_js_1.ButtonBuilder().setCustomId('wl_show_channels').setLabel('Channels').setStyle(discord_js_1.ButtonStyle.Secondary).setDisabled(true).setEmoji(config.emojis.general));
                    reply.edit({ components: [disabledRow] }).catch(() => { });
                });
            }
            else if (sub === 'reset') {
                let changeCount = 0;
                for (const key of targetKeys) {
                    if (guildData.messageFilters[key].users.length > 0 || guildData.messageFilters[key].roles.length > 0 || guildData.messageFilters[key].channels.length > 0) {
                        guildData.messageFilters[key] = { users: [], roles: [], channels: [] };
                        changeCount++;
                    }
                }
                if (changeCount > 0) {
                    yield database.insertGuild(interaction.guild.id, guildData);
                    yield interaction.editReply({ content: `${config.emojis.success} **Successfully reset whitelist for category: ${category}.**` });
                }
                else {
                    yield interaction.editReply({ content: `${config.emojis.warning} **Whitelist is already empty for category: ${category}.**` });
                }
            }
        }
        catch (error) {
            console.error(error);
            yield interaction.editReply({ content: `${config.emojis.error} **Failed to update whitelist.**` });
        }
    });
}
function userIdSummary(items) {
    return items.slice(0, 20).join('\n') + (items.length > 20 ? `\n...and ${items.length - 20} more` : '');
}
