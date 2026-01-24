
import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, Interaction, ButtonInteraction, ModalSubmitInteraction, ChannelType, TextChannel } from "discord.js";
import { Database } from "../../database";
import * as config from "../../config";

export const command = new SlashCommandBuilder()
    .setName('color')
    .setDescription('Manage custom color roles')
    .addSubcommand(sub =>
        sub.setName('panel')
            .setDescription('Create a Color Manager Panel')
    )
    .addSubcommand(sub =>
        sub.setName('cleanup')
            .setDescription('Delete unused user color roles')
    );

export async function run(interaction: ChatInputCommandInteraction, database: Database) {
    if (!interaction.guild) return;

    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageRoles) && interaction.user.id !== process.env.OWNER_ID) {
        return interaction.reply({ content: `${config.emojis.error} You do not have permission to manage roles.`, ephemeral: true });
    }

    const subcommand = interaction.options.getSubcommand() || 'panel';

    if (subcommand === 'panel') {
        // Same Editor Logic as RR but simplified
        const state = {
            title: "Color Manager",
            description: "Click the button below to change your name color!",
            color: 0x5865F2
        };
        await sendEditor(interaction, state);
    }

    if (subcommand === 'cleanup') {
        await interaction.deferReply();
        let count = 0;
        const roles = interaction.guild.roles.cache.filter(r => r.name.startsWith('UserColor-'));
        for (const [id, role] of roles) {
            if (role.members.size === 0) {
                try {
                    await role.delete("Unused Color Role");
                    count++;
                } catch { }
            }
        }
        await interaction.editReply(`${config.emojis.success} Cleaned up **${count}** unused color roles.`);
    }
}

async function sendEditor(interaction: Interaction, state: any) {
    const embed = new EmbedBuilder()
        .setTitle(state.title)
        .setDescription(state.description)
        .setColor(state.color)
        .setFooter({ text: "Use Hex Codes (e.g. #FF0000)" });

    const components: any[] = [];

    // Editor Controls (Only allowing Title/Desc edit for simplicity)
    const controlRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId('colored_title').setLabel('Edit Title').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('colored_desc').setLabel('Edit Desc').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('colored_send').setLabel('Send Panel').setStyle(ButtonStyle.Primary)
    );
    components.push(controlRow);

    // Preview Row (The magic button)
    const previewRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId('color_manager_open').setLabel('🎨 Change Color').setStyle(ButtonStyle.Success)
    );
    components.push(previewRow);

    const payload = {
        content: `**Color Panel Editor**`,
        embeds: [embed],
        components: components,
        ephemeral: true
    };

    if (interaction.isCommand()) {
        await interaction.reply(payload);
    } else {
        await (interaction as any).update(payload);
    }
}

// Temporary Session for Color Editor
const editorSessions = new Map<string, any>();

import { StringSelectMenuInteraction, AnySelectMenuInteraction } from "discord.js";

export async function handleInteraction(interaction: ButtonInteraction | ModalSubmitInteraction | AnySelectMenuInteraction, database: Database) {
    if (!interaction.guild) return;
    const userId = interaction.user.id;
    const member = interaction.guild.members.cache.get(userId) || await interaction.guild.members.fetch(userId);

    if (interaction.isButton()) {
        const id = interaction.customId;

        // --- PUBLIC HANDLER ---
        if (id === 'color_manager_open') {
            const modal = new ModalBuilder().setCustomId('color_modal_input').setTitle('Change Name Color');
            modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(
                new TextInputBuilder().setCustomId('hex').setLabel('Hex Color (e.g. #FF0000)').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(7)
            ));
            return interaction.showModal(modal);
        }

        // --- EDITOR HANDLER ---

        // Recover Session
        let state = editorSessions.get(userId);
        if (!state && id.startsWith('colored_')) {
            state = {
                title: "Color Manager",
                description: "Click below to change color!",
                color: 0x5865F2
            };
        }

        if (id === 'colored_title') {
            const modal = new ModalBuilder().setCustomId('colored_modal_title').setTitle('Edit Title');
            modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId('text').setLabel('Title').setStyle(TextInputStyle.Short).setValue(state.title)));
            editorSessions.set(userId, state);
            return interaction.showModal(modal);
        }
        if (id === 'colored_desc') {
            const modal = new ModalBuilder().setCustomId('colored_modal_desc').setTitle('Edit Description');
            modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId('text').setLabel('Description').setStyle(TextInputStyle.Paragraph).setValue(state.description)));
            editorSessions.set(userId, state);
            return interaction.showModal(modal);
        }
        if (id === 'colored_send') {
            const channelSelect = new (require('discord.js').ChannelSelectMenuBuilder)()
                .setCustomId('colored_select_channel')
                .setPlaceholder('Select channel')
                .setChannelTypes(ChannelType.GuildText);

            editorSessions.set(userId, state);
            const row = new ActionRowBuilder<any>().addComponents(channelSelect);
            return interaction.reply({ content: "Where should I send the Color Panel?", components: [row], ephemeral: true });
        }
    }

    // --- SELECT MENU HANDLER ---
    if (interaction.isAnySelectMenu()) {
        const menuInteraction = interaction as any;
        if (menuInteraction.customId === 'colored_select_channel') {
            const state = editorSessions.get(userId);
            if (!state) return;

            const channelId = menuInteraction.values[0];
            const channel = interaction.guild!.channels.cache.get(channelId) as TextChannel;

            const embed = new EmbedBuilder()
                .setTitle(state.title)
                .setDescription(state.description)
                .setColor(state.color)
                .setFooter({ text: "Use Hex Codes (e.g. #FF0000)" });

            const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder().setCustomId('color_manager_open').setLabel('🎨 Change Color').setStyle(ButtonStyle.Success)
            );

            await channel.send({ embeds: [embed], components: [row] });
            return menuInteraction.update({ content: `${config.emojis.success} Color Panel sent to ${channel}!`, components: [] });
        }
    }

    if (interaction.isModalSubmit()) {
        const id = interaction.customId;

        // --- PUBLIC HEX HANDLER ---
        if (id === 'color_modal_input') {
            let hex = interaction.fields.getTextInputValue('hex').replace('#', '');
            if (!/^[0-9A-F]{6}$/i.test(hex)) {
                return interaction.reply({ content: `${config.emojis.error} Invalid Hex Code! Example: \`#FF0000\``, ephemeral: true });
            }

            const roleName = `UserColor-${userId}`;
            let role = interaction.guild.roles.cache.find(r => r.name === roleName);

            try {
                if (!role) {
                    // Create new role
                    role = await interaction.guild.roles.create({
                        name: roleName,
                        color: parseInt(hex, 16),
                        permissions: [],
                        reason: `User Color for ${interaction.user.tag}`
                    });

                    // Try to move it to a high position logic?
                    // Ideally, find the "Bot" role and place it below.
                    // For now, new roles are at bottom. Needs to be high to show color.
                    // We can attempt to set position if bot has perms.
                    // Let's rely on admin sorting it once or warn user.

                    await member.roles.add(role);
                } else {
                    await role.setColor(parseInt(hex, 16));
                    if (!member.roles.cache.has(role.id)) await member.roles.add(role);
                }

                await interaction.reply({ content: `${config.emojis.success} Your color has been updated to **#${hex.toUpperCase()}**!`, ephemeral: true });
            } catch (err) {
                return interaction.reply({ content: `${config.emojis.error} Failed to set color. Ensure I have \`Manage Roles\` permission and my role is higher than yours!`, ephemeral: true });
            }
            return;
        }

        // --- EDITOR HANDLER ---
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
}
