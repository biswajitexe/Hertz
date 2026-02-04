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
exports.aliases = exports.command = void 0;
exports.run = run;
exports.handleInteraction = handleInteraction;
const discord_js_1 = require("discord.js");
const config = __importStar(require("../../config"));
function sendEditor(interaction, state) {
    return __awaiter(this, void 0, void 0, function* () {
        const previewEmbed = new discord_js_1.EmbedBuilder()
            .setColor(state.color);
        if (state.title)
            previewEmbed.setTitle(state.title);
        if (state.description)
            previewEmbed.setDescription(state.description);
        if (!state.title && !state.description) {
            previewEmbed.setDescription("*Your nice embed will appear here...*\n\nUse `✏️ Edit Embed` to customize this area.");
        }
        const dashboardEmbed = new discord_js_1.EmbedBuilder()
            .setTitle(`Control Panel`)
            .setColor(0x2B2D31)
            .addFields({
            name: 'Title & Description',
            value: `Title: \`${state.title ? 'Set' : 'Not Set'}\`\nDescription: \`${state.description ? 'Set' : 'Not Set'}\``,
            inline: true
        }, {
            name: 'Configuration',
            value: `Color: \`#${state.color.toString(16).toUpperCase()}\`\nRoles: \`${state.roles.length}\``,
            inline: true
        })
            .setFooter({ text: "Use buttons below to edit" });
        const components = [];
        const controlRow = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId('rred_edit_all').setLabel('✏️ Edit Embed').setStyle(discord_js_1.ButtonStyle.Primary), new discord_js_1.ButtonBuilder().setCustomId('rred_add').setLabel('➕ Add Role').setStyle(discord_js_1.ButtonStyle.Success));
        components.push(controlRow);
        const actionRow = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId('rred_send').setLabel('📤 Send Panel').setStyle(discord_js_1.ButtonStyle.Secondary));
        components.push(actionRow);
        if (state.roles.length > 0) {
            let currentRow = new discord_js_1.ActionRowBuilder();
            for (const role of state.roles) {
                if (currentRow.components.length >= 5) {
                    components.push(currentRow);
                    currentRow = new discord_js_1.ActionRowBuilder();
                }
                const btn = new discord_js_1.ButtonBuilder()
                    .setCustomId(`preview_${role.id}`)
                    .setLabel(role.label)
                    .setStyle(role.style);
                if (role.emoji) {
                    try {
                        btn.setEmoji(role.emoji);
                    }
                    catch (e) {
                    }
                }
                currentRow.addComponents(btn);
            }
            if (currentRow.components.length > 0)
                components.push(currentRow);
        }
        const payload = {
            content: ``,
            embeds: [previewEmbed, dashboardEmbed],
            components: components
        };
        try {
            if (interaction instanceof discord_js_1.Message) {
                yield interaction.edit(payload);
            }
            else if (interaction.isCommand()) {
                yield interaction.reply(Object.assign(Object.assign({}, payload), { ephemeral: true }));
            }
            else if (interaction.isButton() || interaction.isAnySelectMenu() || interaction.isModalSubmit()) {
                yield interaction.update(payload);
            }
        }
        catch (e) {
            console.error("Error in sendEditor:", e);
        }
    });
}
const editorSessions = new Map();
exports.command = new discord_js_1.SlashCommandBuilder()
    .setName('rr')
    .setDescription('Manage reaction roles');
exports.aliases = ['reactionrole', 'rrole'];
exports.command
    .addSubcommand(sub => sub.setName('editor')
    .setDescription('Open the Reaction Role Editor'));
function run(interaction, database) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        if (!interaction.guild)
            return;
        if (!((_a = interaction.memberPermissions) === null || _a === void 0 ? void 0 : _a.has(discord_js_1.PermissionFlagsBits.ManageRoles)) && interaction.user.id !== process.env.OWNER_ID) {
            return interaction.reply({ content: `${config.emojis.error} You do not have permission to manage roles.`, ephemeral: true });
        }
        const subcommand = interaction.options.getSubcommand() || 'editor';
        if (subcommand === 'editor') {
            const state = {
                title: "",
                description: "",
                color: 0x5865F2,
                roles: []
            };
            editorSessions.set(interaction.user.id, state);
            yield sendEditor(interaction, state);
        }
    });
}
function handleInteraction(interaction, database) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!interaction.guild)
            return;
        const userId = interaction.user.id;
        try {
            if (interaction.isButton()) {
                const id = interaction.customId;
                if (id.startsWith('rr_toggle_')) {
                    const roleId = id.replace('rr_toggle_', '');
                    const role = interaction.guild.roles.cache.get(roleId);
                    if (!role)
                        return interaction.reply({ content: `${config.emojis.error} Role not found.`, ephemeral: true });
                    const member = interaction.member;
                    const hasRole = member.roles.cache.has(roleId);
                    try {
                        if (hasRole) {
                            yield member.roles.remove(role);
                            return interaction.reply({ content: `${config.emojis.delete} Removed **${role.name}**`, ephemeral: true });
                        }
                        else {
                            yield member.roles.add(role);
                            return interaction.reply({ content: `${config.emojis.success} Added **${role.name}**`, ephemeral: true });
                        }
                    }
                    catch (err) {
                        return interaction.reply({ content: `${config.emojis.error} I cannot manage this role.`, ephemeral: true });
                    }
                }
                if (!editorSessions.has(userId) && id.startsWith('rred_')) {
                    return interaction.reply({ content: "Session expired. Please run `/rr editor` again.", ephemeral: true });
                }
                const state = editorSessions.get(userId);
                if (id === 'rred_edit_all') {
                    const modal = new discord_js_1.ModalBuilder().setCustomId('rred_modal_all').setTitle('Configure Embed');
                    modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder().setCustomId('title').setLabel('Title').setStyle(discord_js_1.TextInputStyle.Short).setValue(state.title || "").setPlaceholder("Enter Title").setRequired(true)), new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder().setCustomId('desc').setLabel('Description').setStyle(discord_js_1.TextInputStyle.Paragraph).setValue(state.description || "").setPlaceholder("Enter Description").setRequired(true)), new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder().setCustomId('color').setLabel('Hex Color').setStyle(discord_js_1.TextInputStyle.Short).setValue(state.color.toString(16) || "5865F2").setRequired(false)));
                    return interaction.showModal(modal);
                }
                if (id === 'rred_add') {
                    const roleSelect = new (require('discord.js').RoleSelectMenuBuilder)()
                        .setCustomId('rred_select_role_final')
                        .setPlaceholder('Select the role to add');
                    const row2 = new discord_js_1.ActionRowBuilder().addComponents(roleSelect);
                    return interaction.reply({ content: "Select the role to add:", components: [row2], ephemeral: true });
                }
                if (id === 'rred_send') {
                    const channelSelect = new (require('discord.js').ChannelSelectMenuBuilder)()
                        .setCustomId('rred_select_channel')
                        .setPlaceholder('Select channel to send panel')
                        .setChannelTypes(discord_js_1.ChannelType.GuildText);
                    const row = new discord_js_1.ActionRowBuilder().addComponents(channelSelect);
                    return interaction.reply({ content: "Where should I send this panel?", components: [row], ephemeral: true });
                }
            }
            if (interaction.isAnySelectMenu()) {
                const state = editorSessions.get(userId);
                if (!state && !interaction.customId.startsWith('rr_toggle'))
                    return;
                if (interaction.customId === 'rred_select_role_final') {
                    const roleId = interaction.values[0];
                    const role = interaction.guild.roles.cache.get(roleId);
                    if (!role)
                        return;
                    const modal = new discord_js_1.ModalBuilder().setCustomId(`rred_modal_addrole_${roleId}`).setTitle('Button Details');
                    modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder().setCustomId('label').setLabel('Label').setValue(role.name).setStyle(discord_js_1.TextInputStyle.Short)), new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder().setCustomId('emoji').setLabel('Emoji').setRequired(false).setStyle(discord_js_1.TextInputStyle.Short)));
                    return interaction.showModal(modal);
                }
                if (interaction.customId === 'rred_select_channel') {
                    const channelId = interaction.values[0];
                    const channel = interaction.guild.channels.cache.get(channelId);
                    const embed = new discord_js_1.EmbedBuilder()
                        .setColor(state.color);
                    if (state.title)
                        embed.setTitle(state.title);
                    if (state.description)
                        embed.setDescription(state.description);
                    const rows = [];
                    let currentRow = new discord_js_1.ActionRowBuilder();
                    for (const role of state.roles) {
                        if (currentRow.components.length >= 5) {
                            rows.push(currentRow);
                            currentRow = new discord_js_1.ActionRowBuilder();
                        }
                        const btn = new discord_js_1.ButtonBuilder()
                            .setCustomId(`rr_toggle_${role.id}`)
                            .setLabel(role.label)
                            .setStyle(role.style);
                        if (role.emoji)
                            btn.setEmoji(role.emoji);
                        currentRow.addComponents(btn);
                    }
                    if (currentRow.components.length > 0)
                        rows.push(currentRow);
                    yield channel.send({ embeds: [embed], components: rows });
                    editorSessions.delete(userId);
                    return interaction.update({ content: `${config.emojis.success} Panel sent to ${channel}!`, components: [], embeds: [] });
                }
            }
            if (interaction.isModalSubmit()) {
                const id = interaction.customId;
                const state = editorSessions.get(userId);
                if (!state)
                    return;
                if (id === 'rred_modal_all') {
                    state.title = interaction.fields.getTextInputValue('title');
                    state.description = interaction.fields.getTextInputValue('desc');
                    let hex = interaction.fields.getTextInputValue('color');
                    if (!hex)
                        hex = "5865F2";
                    const cleanHex = hex.replace('#', '');
                    state.color = parseInt(cleanHex, 16) || 0x5865F2;
                    editorSessions.set(userId, state);
                    return sendEditor(interaction, state);
                }
                if (id.startsWith('rred_modal_addrole_')) {
                    const roleId = id.replace('rred_modal_addrole_', '');
                    const label = interaction.fields.getTextInputValue('label');
                    let emoji = interaction.fields.getTextInputValue('emoji');
                    const customEmojiMatch = emoji.match(/<a?:.+:(\d+)>/);
                    if (customEmojiMatch) {
                        emoji = customEmojiMatch[1];
                    }
                    state.roles.push({
                        id: roleId,
                        label: label,
                        emoji: emoji,
                        style: discord_js_1.ButtonStyle.Secondary
                    });
                    yield interaction.update({ content: "Role added!", components: [] });
                    if (interaction.message) {
                        yield sendEditor(interaction.message, state);
                    }
                    return;
                }
                editorSessions.set(userId, state);
                if (interaction.message)
                    yield sendEditor(interaction.message, state);
            }
        }
        catch (error) {
            console.error("Interaction Handler Error:", error);
            if (!interaction.replied && !interaction.deferred) {
                yield interaction.reply({ content: "Something went wrong.", ephemeral: true }).catch(() => { });
            }
        }
    });
}
