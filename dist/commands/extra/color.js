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
exports.handleInteraction = handleInteraction;
const discord_js_1 = require("discord.js");
const config = __importStar(require("../../config"));
exports.command = new discord_js_1.SlashCommandBuilder()
    .setName('color')
    .setDescription('Manage custom color roles')
    .addSubcommand(sub => sub.setName('panel')
    .setDescription('Create a Color Manager Panel'))
    .addSubcommand(sub => sub.setName('cleanup')
    .setDescription('Delete unused user color roles'));
function run(interaction, database) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        if (!interaction.guild)
            return;
        if (!((_a = interaction.memberPermissions) === null || _a === void 0 ? void 0 : _a.has(discord_js_1.PermissionFlagsBits.ManageRoles)) && interaction.user.id !== process.env.OWNER_ID) {
            return interaction.reply({ content: `${config.emojis.error} You do not have permission to manage roles.`, ephemeral: true });
        }
        const subcommand = interaction.options.getSubcommand() || 'panel';
        if (subcommand === 'panel') {
            const state = {
                title: "Color Manager",
                description: "Click the button below to change your name color!",
                color: 0x5865F2
            };
            yield sendEditor(interaction, state);
        }
        if (subcommand === 'cleanup') {
            yield interaction.deferReply();
            let count = 0;
            const roles = interaction.guild.roles.cache.filter(r => r.name.startsWith('UserColor-'));
            for (const [id, role] of roles) {
                if (role.members.size === 0) {
                    try {
                        yield role.delete("Unused Color Role");
                        count++;
                    }
                    catch (_b) { }
                }
            }
            yield interaction.editReply(`${config.emojis.success} Cleaned up **${count}** unused color roles.`);
        }
    });
}
function sendEditor(interaction, state) {
    return __awaiter(this, void 0, void 0, function* () {
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle(state.title)
            .setDescription(state.description)
            .setColor(state.color)
            .setFooter({ text: "Use Hex Codes (e.g. #FF0000)" });
        const components = [];
        const controlRow = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId('colored_title').setLabel('Edit Title').setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder().setCustomId('colored_desc').setLabel('Edit Desc').setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder().setCustomId('colored_send').setLabel('Send Panel').setStyle(discord_js_1.ButtonStyle.Primary));
        components.push(controlRow);
        const previewRow = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId('color_manager_open').setLabel('🎨 Change Color').setStyle(discord_js_1.ButtonStyle.Success));
        components.push(previewRow);
        const payload = {
            content: `**Color Panel Editor**`,
            embeds: [embed],
            components: components,
            ephemeral: true
        };
        if (interaction.isCommand()) {
            yield interaction.reply(payload);
        }
        else {
            yield interaction.update(payload);
        }
    });
}
const editorSessions = new Map();
function handleInteraction(interaction, database) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!interaction.guild)
            return;
        const userId = interaction.user.id;
        const member = interaction.guild.members.cache.get(userId) || (yield interaction.guild.members.fetch(userId));
        if (interaction.isButton()) {
            const id = interaction.customId;
            if (id === 'color_manager_open') {
                const modal = new discord_js_1.ModalBuilder().setCustomId('color_modal_input').setTitle('Change Name Color');
                modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder().setCustomId('hex').setLabel('Hex Color (e.g. #FF0000)').setStyle(discord_js_1.TextInputStyle.Short).setRequired(true).setMaxLength(7)));
                return interaction.showModal(modal);
            }
            let state = editorSessions.get(userId);
            if (!state && id.startsWith('colored_')) {
                state = {
                    title: "Color Manager",
                    description: "Click below to change color!",
                    color: 0x5865F2
                };
            }
            if (id === 'colored_title') {
                const modal = new discord_js_1.ModalBuilder().setCustomId('colored_modal_title').setTitle('Edit Title');
                modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder().setCustomId('text').setLabel('Title').setStyle(discord_js_1.TextInputStyle.Short).setValue(state.title)));
                editorSessions.set(userId, state);
                return interaction.showModal(modal);
            }
            if (id === 'colored_desc') {
                const modal = new discord_js_1.ModalBuilder().setCustomId('colored_modal_desc').setTitle('Edit Description');
                modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder().setCustomId('text').setLabel('Description').setStyle(discord_js_1.TextInputStyle.Paragraph).setValue(state.description)));
                editorSessions.set(userId, state);
                return interaction.showModal(modal);
            }
            if (id === 'colored_send') {
                const channelSelect = new (require('discord.js').ChannelSelectMenuBuilder)()
                    .setCustomId('colored_select_channel')
                    .setPlaceholder('Select channel')
                    .setChannelTypes(discord_js_1.ChannelType.GuildText);
                editorSessions.set(userId, state);
                const row = new discord_js_1.ActionRowBuilder().addComponents(channelSelect);
                return interaction.reply({ content: "Where should I send the Color Panel?", components: [row], ephemeral: true });
            }
        }
        if (interaction.isAnySelectMenu()) {
            const menuInteraction = interaction;
            if (menuInteraction.customId === 'colored_select_channel') {
                const state = editorSessions.get(userId);
                if (!state)
                    return;
                const channelId = menuInteraction.values[0];
                const channel = interaction.guild.channels.cache.get(channelId);
                const embed = new discord_js_1.EmbedBuilder()
                    .setTitle(state.title)
                    .setDescription(state.description)
                    .setColor(state.color)
                    .setFooter({ text: "Use Hex Codes (e.g. #FF0000)" });
                const row = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId('color_manager_open').setLabel('🎨 Change Color').setStyle(discord_js_1.ButtonStyle.Success));
                yield channel.send({ embeds: [embed], components: [row] });
                return menuInteraction.update({ content: `${config.emojis.success} Color Panel sent to ${channel}!`, components: [] });
            }
        }
        if (interaction.isModalSubmit()) {
            const id = interaction.customId;
            if (id === 'color_modal_input') {
                let hex = interaction.fields.getTextInputValue('hex').replace('#', '');
                if (!/^[0-9A-F]{6}$/i.test(hex)) {
                    return interaction.reply({ content: `${config.emojis.error} Invalid Hex Code! Example: \`#FF0000\``, ephemeral: true });
                }
                const roleName = `UserColor-${userId}`;
                let role = interaction.guild.roles.cache.find(r => r.name === roleName);
                try {
                    if (!role) {
                        role = yield interaction.guild.roles.create({
                            name: roleName,
                            color: parseInt(hex, 16),
                            permissions: [],
                            reason: `User Color for ${interaction.user.tag}`
                        });
                        yield member.roles.add(role);
                    }
                    else {
                        yield role.setColor(parseInt(hex, 16));
                        if (!member.roles.cache.has(role.id))
                            yield member.roles.add(role);
                    }
                    yield interaction.reply({ content: `${config.emojis.success} Your color has been updated to **#${hex.toUpperCase()}**!`, ephemeral: true });
                }
                catch (err) {
                    return interaction.reply({ content: `${config.emojis.error} Failed to set color. Ensure I have \`Manage Roles\` permission and my role is higher than yours!`, ephemeral: true });
                }
                return;
            }
            const state = editorSessions.get(userId);
            if (id === 'colored_modal_title') {
                state.title = interaction.fields.getTextInputValue('text');
                editorSessions.set(userId, state);
                return sendEditor(interaction, state);
            }
            if (id === 'colored_modal_desc') {
                state.description = interaction.fields.getTextInputValue('text');
                editorSessions.set(userId, state);
                return sendEditor(interaction, state);
            }
        }
    });
}
