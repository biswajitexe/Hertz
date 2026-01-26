import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, StringSelectMenuBuilder, ButtonInteraction, StringSelectMenuInteraction } from "discord.js";
import { Database } from "../../database";
import * as config from "../../config";
import fs from 'fs';
import path from 'path';

export const command = new SlashCommandBuilder()
    .setName('dev')
    .setDescription('Owner Only Control Panel');

export async function run(interaction: ChatInputCommandInteraction, database: Database) {
    if (interaction.user.id !== process.env.OWNER_ID) {
        if (!interaction.isRepliable()) return;
        return interaction.reply({ content: "Unknown command.", ephemeral: true });
    }
    await sendOwnerPanel(interaction);
}

export async function handleInteraction(interaction: ButtonInteraction | StringSelectMenuInteraction, database: Database) {
    if (!interaction.customId.startsWith('dev_')) return;

    if (interaction.user.id !== process.env.OWNER_ID) {
        return interaction.reply({ content: "You cannot use this menu.", ephemeral: true });
    }

    if (interaction.isButton() && interaction.customId === 'dev_home') {
        await sendOwnerPanel(interaction, true);
    } 
    else if (interaction.isStringSelectMenu() && interaction.customId === 'dev_select') {
        const commandName = interaction.values[0];
        
        try {
            const ownerDir = path.join(__dirname);
            const files = fs.readdirSync(ownerDir).filter(file => (file.endsWith('.ts') || file.endsWith('.js')) && !file.startsWith('dev'));
            
            let foundCmd: any = null;
            for(const file of files) {
                try {
                    const cmd = require(path.join(ownerDir, file));
                    if(cmd.command && cmd.command.name === commandName) {
                        foundCmd = cmd;
                        break;
                    }
                } catch {}
            }

            if (!foundCmd) {
                return interaction.reply({ content: `Command information not found for \`${commandName}\`.`, ephemeral: true });
            }

            const embed = new EmbedBuilder()
                .setColor(config.colors.primary)
                .setTitle(`${config.prefix}${foundCmd.command.name}`)
                .setDescription(`> ${foundCmd.command.description || "No description provided."}`)
                .setFooter({ text: "Xeon • Owner Command", iconURL: interaction.client.user?.displayAvatarURL() });

            // Navigation Buttons
            const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder().setCustomId("dev_home").setEmoji(config.emojis.home).setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId("help_delete").setEmoji(config.emojis.delete).setStyle(ButtonStyle.Danger)
            );

            const selectMenu = await createOwnerSelectMenu();

            await interaction.update({ embeds: [embed], components: [selectMenu, buttons] });

        } catch (error) {
            console.error(error);
            await interaction.reply({ content: "Error retrieving command details.", ephemeral: true });
        }
    }
}

async function sendOwnerPanel(interaction: any, isUpdate = false) {
    const ownerDir = path.join(__dirname);
    const files = fs.readdirSync(ownerDir).filter(file => (file.endsWith('.ts') || file.endsWith('.js')) && !file.startsWith('dev'));

    const cleanCommands = files.map(file => {
        try {
            const cmd = require(path.join(ownerDir, file));
            if (cmd.command && cmd.command.name) {
                return `\`${config.prefix}${cmd.command.name}\``;
            }
        } catch { return null; }
    }).filter(c => c !== null).join(", ");

    const embed = new EmbedBuilder()
        .setColor(config.colors.primary)
        .setTitle('<:74658vipglow:1465051133704798435> Owner Commands')
        .setDescription(`> ${cleanCommands}`)
        .setFooter({ text: `Xeon • Owner Commands`, iconURL: interaction.client.user?.displayAvatarURL() || undefined });

    const selectMenu = await createOwnerSelectMenu();

    const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId("help_home").setEmoji(config.emojis.home).setStyle(ButtonStyle.Secondary).setDisabled(true), // Disabled on Home
        new ButtonBuilder().setCustomId("help_delete").setEmoji(config.emojis.delete).setStyle(ButtonStyle.Danger)
    );

    if (isUpdate) {
        await interaction.update({ embeds: [embed], components: [selectMenu, buttons] });
    } else {
        await interaction.reply({ embeds: [embed], components: [selectMenu, buttons], ephemeral: true });
    }
}

async function createOwnerSelectMenu() {
    const ownerDir = path.join(__dirname);
    const files = fs.readdirSync(ownerDir).filter(file => (file.endsWith('.ts') || file.endsWith('.js')) && !file.startsWith('dev'));

    const selectOptions = files.map(file => {
        try {
            const cmd = require(path.join(ownerDir, file));
            if (cmd.command && cmd.command.name) {
                return {
                    label: cmd.command.name,
                    description: cmd.command.description ? cmd.command.description.substring(0, 100) : 'No description',
                    value: cmd.command.name,
                    emoji: config.emojis.owner || '👑'
                };
            }
        } catch { return null; }
    }).filter(opt => opt !== null) as any[];

    return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId("dev_select")
            .setPlaceholder("Select a Command")
            .addOptions(selectOptions)
    );
}
