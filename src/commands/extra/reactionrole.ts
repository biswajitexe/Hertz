
import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, Interaction, ButtonInteraction, StringSelectMenuInteraction, ModalSubmitInteraction, ChannelType, TextChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, Message } from "discord.js";
import { Database } from "../../database";
import * as config from "../../config";

async function sendEditor(interaction: Interaction | Message, state: any) {
    // 1. Preview Embed (The exact embed to be sent)
    const previewEmbed = new EmbedBuilder()
        .setColor(state.color);

    if (state.title) previewEmbed.setTitle(state.title);
    if (state.description) previewEmbed.setDescription(state.description);

    // Fallback if both are empty (for preview only)
    if (!state.title && !state.description) {
        previewEmbed.setDescription("*Your nice embed will appear here...*\n\nUse `✏️ Edit Embed` to customize this area.");
    }

    // 2. Dashboard Embed (The "Control Panel" - Minimalist Premium)
    const dashboardEmbed = new EmbedBuilder()
        .setTitle(`Control Panel`)
        .setColor(0x2B2D31) // Dark theme
        .addFields(
            {
                name: 'Title & Description',
                value: `Title: \`${state.title ? 'Set' : 'Not Set'}\`\nDescription: \`${state.description ? 'Set' : 'Not Set'}\``,
                inline: true
            },
            {
                name: 'Configuration',
                value: `Color: \`#${state.color.toString(16).toUpperCase()}\`\nRoles: \`${state.roles.length}\``,
                inline: true
            }
        )
        .setFooter({ text: "Use buttons below to edit" });

    const components: any[] = [];

    // 1. Editor Controls
    const controlRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId('rred_edit_all').setLabel('✏️ Edit Embed').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('rred_add').setLabel('➕ Add Role').setStyle(ButtonStyle.Success)
    );
    components.push(controlRow);

    // 2. Action Controls
    const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId('rred_send').setLabel('📤 Send Panel').setStyle(ButtonStyle.Secondary)
    );
    components.push(actionRow);

    // 3. Preview Buttons
    if (state.roles.length > 0) {
        let currentRow = new ActionRowBuilder<ButtonBuilder>();
        for (const role of state.roles) {
            if (currentRow.components.length >= 5) {
                components.push(currentRow);
                currentRow = new ActionRowBuilder<ButtonBuilder>();
            }
            const btn = new ButtonBuilder()
                .setCustomId(`preview_${role.id}`)
                .setLabel(role.label)
                .setStyle(role.style);

            if (role.emoji) {
                try {
                    btn.setEmoji(role.emoji);
                } catch (e) {
                    // Ignore invalid emoji, render button without it
                }
            }

            currentRow.addComponents(btn);
        }
        if (currentRow.components.length > 0) components.push(currentRow);
    }

    const payload = {
        content: ``,
        embeds: [previewEmbed, dashboardEmbed],
        components: components
    };

    try {
        if (interaction instanceof Message) {
            await interaction.edit(payload);
        } else if (interaction.isCommand()) {
            await (interaction as any).reply({ ...payload, ephemeral: true });
        } else if (interaction.isButton() || interaction.isAnySelectMenu() || interaction.isModalSubmit()) {
            await (interaction as any).update(payload);
        }
    } catch (e) {
        console.error("Error in sendEditor:", e);
    }
}

// Temporary in-memory storage for editor sessions (User ID -> State)
const editorSessions = new Map<string, any>();

export const command = new SlashCommandBuilder()
    .setName('rr')
    .setDescription('Manage reaction roles');

export const aliases = ['reactionrole', 'rrole'];

command
    .addSubcommand(sub =>
        sub.setName('editor')
            .setDescription('Open the Reaction Role Editor')
    );

export async function run(interaction: ChatInputCommandInteraction, database: Database) {
    if (!interaction.guild) return;

    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageRoles) && interaction.user.id !== process.env.OWNER_ID) {
        return interaction.reply({ content: `${config.emojis.error} You do not have permission to manage roles.`, ephemeral: true });
    }

    const subcommand = interaction.options.getSubcommand() || 'editor';

    if (subcommand === 'editor') {
        const state = {
            title: "",
            description: "",
            color: 0x5865F2,
            roles: [] as { id: string, label: string, emoji: string, style: ButtonStyle }[]
        };
        editorSessions.set(interaction.user.id, state);
        await sendEditor(interaction, state);
    }
}

export async function handleInteraction(interaction: ButtonInteraction | StringSelectMenuInteraction | ModalSubmitInteraction | any, database: Database) {
    if (!interaction.guild) return;
    const userId = interaction.user.id;

    try {
        // --- BUTTON HANDLER ---
        if (interaction.isButton()) {
            const id = interaction.customId;

            // Toggle Click
            if (id.startsWith('rr_toggle_')) {
                const roleId = id.replace('rr_toggle_', '');
                const role = interaction.guild.roles.cache.get(roleId);
                if (!role) return interaction.reply({ content: `${config.emojis.error} Role not found.`, ephemeral: true });

                const member = interaction.member as any;
                const hasRole = member.roles.cache.has(roleId);

                try {
                    if (hasRole) {
                        await member.roles.remove(role);
                        return interaction.reply({ content: `${config.emojis.delete} Removed **${role.name}**`, ephemeral: true });
                    } else {
                        await member.roles.add(role);
                        return interaction.reply({ content: `${config.emojis.success} Added **${role.name}**`, ephemeral: true });
                    }
                } catch (err) {
                    return interaction.reply({ content: `${config.emojis.error} I cannot manage this role.`, ephemeral: true });
                }
            }

            // --- EDITOR LOGIC ---
            if (!editorSessions.has(userId) && id.startsWith('rred_')) {
                return interaction.reply({ content: "Session expired. Please run `/rr editor` again.", ephemeral: true });
            }

            const state = editorSessions.get(userId);

            if (id === 'rred_edit_all') {
                const modal = new ModalBuilder().setCustomId('rred_modal_all').setTitle('Configure Embed');
                modal.addComponents(
                    new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId('title').setLabel('Title').setStyle(TextInputStyle.Short).setValue(state.title || "").setPlaceholder("Enter Title").setRequired(true)),
                    new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId('desc').setLabel('Description').setStyle(TextInputStyle.Paragraph).setValue(state.description || "").setPlaceholder("Enter Description").setRequired(true)),
                    new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId('color').setLabel('Hex Color').setStyle(TextInputStyle.Short).setValue(state.color.toString(16) || "5865F2").setRequired(false))
                );
                return interaction.showModal(modal);
            }

            if (id === 'rred_add') {
                const roleSelect = new (require('discord.js').RoleSelectMenuBuilder)()
                    .setCustomId('rred_select_role_final')
                    .setPlaceholder('Select the role to add');
                const row2 = new ActionRowBuilder<any>().addComponents(roleSelect);
                return interaction.reply({ content: "Select the role to add:", components: [row2], ephemeral: true });
            }

            if (id === 'rred_send') {
                const channelSelect = new (require('discord.js').ChannelSelectMenuBuilder)()
                    .setCustomId('rred_select_channel')
                    .setPlaceholder('Select channel to send panel')
                    .setChannelTypes(ChannelType.GuildText);
                const row = new ActionRowBuilder<any>().addComponents(channelSelect);
                return interaction.reply({ content: "Where should I send this panel?", components: [row], ephemeral: true });
            }
        }

        // --- SELECT MENU HANDLER ---
        if (interaction.isAnySelectMenu()) {
            const state = editorSessions.get(userId);
            if (!state && !interaction.customId.startsWith('rr_toggle')) return;

            if (interaction.customId === 'rred_select_role_final') {
                const roleId = interaction.values[0];
                const role = interaction.guild.roles.cache.get(roleId);
                if (!role) return;

                const modal = new ModalBuilder().setCustomId(`rred_modal_addrole_${roleId}`).setTitle('Button Details');
                modal.addComponents(
                    new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId('label').setLabel('Label').setValue(role.name).setStyle(TextInputStyle.Short)),
                    new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId('emoji').setLabel('Emoji').setRequired(false).setStyle(TextInputStyle.Short))
                );
                return interaction.showModal(modal);
            }

            if (interaction.customId === 'rred_select_channel') {
                const channelId = interaction.values[0];
                const channel = interaction.guild.channels.cache.get(channelId) as TextChannel;

                const embed = new EmbedBuilder()
                    .setColor(state.color);

                if (state.title) embed.setTitle(state.title);
                if (state.description) embed.setDescription(state.description);

                const rows: any[] = [];
                let currentRow = new ActionRowBuilder<ButtonBuilder>();
                for (const role of state.roles) {
                    if (currentRow.components.length >= 5) {
                        rows.push(currentRow);
                        currentRow = new ActionRowBuilder<ButtonBuilder>();
                    }
                    const btn = new ButtonBuilder()
                        .setCustomId(`rr_toggle_${role.id}`)
                        .setLabel(role.label)
                        .setStyle(role.style);
                    if (role.emoji) btn.setEmoji(role.emoji);
                    currentRow.addComponents(btn);
                }
                if (currentRow.components.length > 0) rows.push(currentRow);

                await channel.send({ embeds: [embed], components: rows });
                editorSessions.delete(userId);
                return interaction.update({ content: `${config.emojis.success} Panel sent to ${channel}!`, components: [], embeds: [] });
            }
        }

        // --- MODAL SUBMIT HANDLER ---
        if (interaction.isModalSubmit()) {
            const id = interaction.customId;
            const state = editorSessions.get(userId);
            if (!state) return;

            if (id === 'rred_modal_all') {
                state.title = interaction.fields.getTextInputValue('title');
                state.description = interaction.fields.getTextInputValue('desc');
                let hex = interaction.fields.getTextInputValue('color');
                if (!hex) hex = "5865F2";
                const cleanHex = hex.replace('#', '');
                state.color = parseInt(cleanHex, 16) || 0x5865F2;

                editorSessions.set(userId, state);
                return sendEditor(interaction, state);
            }

            if (id.startsWith('rred_modal_addrole_')) {
                const roleId = id.replace('rred_modal_addrole_', '');
                const label = interaction.fields.getTextInputValue('label');
                let emoji = interaction.fields.getTextInputValue('emoji');

                // Auto-parse Custom Emoji ID
                // Format: <:name:12345678> or <a:name:12345678>
                const customEmojiMatch = emoji.match(/<a?:.+:(\d+)>/);
                if (customEmojiMatch) {
                    emoji = customEmojiMatch[1];
                }

                state.roles.push({
                    id: roleId,
                    label: label,
                    emoji: emoji,
                    style: ButtonStyle.Secondary
                });

                await (interaction as any).update({ content: "Role added!", components: [] });
                if (interaction.message) {
                    await sendEditor(interaction.message as any, state);
                }
                return;
            }

            editorSessions.set(userId, state);
            if (interaction.message) await sendEditor(interaction.message as any, state);
        }

    } catch (error) {
        console.error("Interaction Handler Error:", error);
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: "Something went wrong.", ephemeral: true }).catch(() => { });
        }
    }
}
