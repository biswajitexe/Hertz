import type { ButtonInteraction, ChatInputCommandInteraction, StringSelectMenuInteraction } from "discord.js";
import { ActionRowBuilder, ApplicationCommandOptionType, ButtonBuilder, ButtonStyle, EmbedBuilder, SlashCommandBuilder, StringSelectMenuBuilder } from "discord.js";
import fs from 'node:fs';
import path from 'node:path';
import * as config from "../../config";
import type { Database } from "../../database";

export const command = new SlashCommandBuilder()
    .setName('dev')
    .setDescription('Owner Only Control Panel');

export async function run(interaction: ChatInputCommandInteraction, database: Database) {
    const botConfig = await database.getBotConfig();
    const owners = (process.env.OWNER_ID || "").split(',').map(id => id.trim());
    if (botConfig?.ownerUsers) owners.push(...botConfig.ownerUsers);

    if (!owners.includes(interaction.user.id)) {
        if (!interaction.isRepliable()) return;
        return interaction.reply({ content: "Unknown command.", ephemeral: true });
    }
    await sendOwnerPanel(interaction);
}

export async function handleInteraction(interaction: ButtonInteraction | StringSelectMenuInteraction, database: Database) {
    if (!interaction.customId.startsWith('dev_')) return;

    const botConfig = await database.getBotConfig();
    const owners = (process.env.OWNER_ID || "").split(',').map(id => id.trim());
    if (botConfig?.ownerUsers) owners.push(...botConfig.ownerUsers);

    if (!owners.includes(interaction.user.id)) {
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
            
            // biome-ignore lint/suspicious/noExplicitAny: Dynamic require
            let foundCmd: any = null;
            for(const file of files) {
                try {
                    const cmd = require(path.join(ownerDir, file));
                    if(cmd.command?.name === commandName) {
                        foundCmd = cmd;
                        break;
                    }
                } catch {}
            }

            if (!foundCmd) {
                return interaction.reply({ content: `Command information not found for \`${commandName}\`.`, ephemeral: true });
            }

            let description = `> ${foundCmd.command.description || "No description provided."}`;
            
            // Check for Subcommands
            const rawData = typeof foundCmd.command.toJSON === 'function' ? foundCmd.command.toJSON() : foundCmd.command;
            // biome-ignore lint/suspicious/noExplicitAny: Dynamic command data
            if (rawData.options?.some((opt: any) => opt.type === ApplicationCommandOptionType.Subcommand || opt.type === ApplicationCommandOptionType.SubcommandGroup)) {
                // Has subcommands
                const subcommands = rawData.options
                    // biome-ignore lint/suspicious/noExplicitAny: Dynamic command data
                    .filter((opt: any) => opt.type === ApplicationCommandOptionType.Subcommand || opt.type === ApplicationCommandOptionType.SubcommandGroup)
                    // biome-ignore lint/suspicious/noExplicitAny: Dynamic command data
                    .map((opt: any) => `\`${opt.name}\``)
                    .join(", ");
                
                if (subcommands) {
                    description = `> ${subcommands}`;
                }
            } else {
                 // No subcommands
                 description = `> \`${foundCmd.command.name}\``;
            }

            const embed = new EmbedBuilder()
                .setColor(config.colors.primary)
                .setTitle(`${foundCmd.command.name.charAt(0).toUpperCase() + foundCmd.command.name.slice(1)}`)
                .setDescription(description)
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

async function sendOwnerPanel(interaction: ChatInputCommandInteraction | ButtonInteraction | StringSelectMenuInteraction, isUpdate = false) {
    const ownerDir = path.join(__dirname);
    const files = fs.readdirSync(ownerDir).filter(file => (file.endsWith('.ts') || file.endsWith('.js')) && !file.startsWith('dev'));

    const cleanCommands = files.map(file => {
        try {
            const cmd = require(path.join(ownerDir, file));
            if (cmd.command?.name) {
                return `\`${config.prefix}${cmd.command.name}\``;
            }
            return null;

        } catch (e) {
            console.error(`[DevCmd] Failed to load ${file}:`, e);
            return null;
        }
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

    if (isUpdate && (interaction.isButton() || interaction.isStringSelectMenu())) {
        await interaction.update({ embeds: [embed], components: [selectMenu, buttons] });
    } else if (interaction.isChatInputCommand()) {
        await interaction.reply({ embeds: [embed], components: [selectMenu, buttons], ephemeral: true });
    }
}

async function createOwnerSelectMenu() {
    const ownerDir = path.join(__dirname);
    const files = fs.readdirSync(ownerDir).filter(file => (file.endsWith('.ts') || file.endsWith('.js')) && !file.startsWith('dev'));

    const selectOptions = files.map(file => {
        try {
            const cmd = require(path.join(ownerDir, file));
            if (cmd.command?.name) {
                return {
                    label: cmd.command.name,
                    value: cmd.command.name,
                    emoji: config.emojis.owner || '👑'
                };
            }
            return null;
        } catch { return null; }
    }).filter((opt): opt is { label: string; value: string; emoji: string } => opt !== null);

    return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId("dev_select")
            .setPlaceholder("Select a Command")
            .addOptions(selectOptions)
    );
}
