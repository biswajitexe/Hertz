import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, StringSelectMenuBuilder } from "discord.js";
import { Database } from "../../database";
import * as config from "../../config";
import fs from 'fs';
import path from 'path';

export const command = new SlashCommandBuilder()
    .setName('dev')
    .setDescription('Owner Only Control Panel');

export async function run(interaction: ChatInputCommandInteraction, database: Database) {
    // Silent Fail for Non-Owners (simulating "doesn't exist")
    if (interaction.user.id !== process.env.OWNER_ID) {
        if (!interaction.isRepliable()) return;
        return interaction.reply({ content: "Unknown command.", ephemeral: true });
    }

    const ownerDir = path.join(__dirname);
    const files = fs.readdirSync(ownerDir).filter(file => (file.endsWith('.ts') || file.endsWith('.js')) && !file.startsWith('dev'));

    // Re-fetching names nicely since I messed up the array above in previous steps (it contained descriptions)
    // Let's reuse the logic properly
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
        .setFooter({ text: `Xeon • Owner Commands (PID: ${process.pid})`, iconURL: interaction.client.user?.displayAvatarURL() || undefined });

    // Replicate Help Menu Components
    // Select Menu - Dynamic Owner Commands
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

    const selectMenu = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId("dev_select")
            .setPlaceholder("Select a Command")
            .addOptions(selectOptions)
    );

    // Buttons
    const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId("help_home").setEmoji(config.emojis.home).setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("help_delete").setEmoji(config.emojis.delete).setStyle(ButtonStyle.Danger)
    );

    // Using help_ components allows reusing the main interaction handler logic in index.ts/help.ts
    // This effectively lets the owner navigate OUT of dev panel into standard help.
    await interaction.reply({ embeds: [embed], components: [selectMenu, buttons], ephemeral: true });
}

export async function handleInteraction(interaction: any, database: Database) {
    if (!interaction.customId.startsWith('dev_')) return;

    if (interaction.isStringSelectMenu() && interaction.customId === 'dev_select') {
        const commandName = interaction.values[0];
        
        try {
            // Try to find the command file
            const ownerDir = path.join(__dirname);
            const files = fs.readdirSync(ownerDir).filter(file => (file.endsWith('.ts') || file.endsWith('.js')));
            
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
                .setTitle(`Owner Command: ${foundCmd.command.name}`)
                .setDescription(foundCmd.command.description || "No description provided.")
                .addFields(
                    { name: "Usage", value: `\`${config.prefix}${foundCmd.command.name}\``, inline: true },
                    { name: "Type", value: "Owner Only", inline: true }
                )
                .setFooter({ text: "Xeon • Owner Panel", iconURL: interaction.client.user?.displayAvatarURL() });

            await interaction.reply({ embeds: [embed], ephemeral: true });

        } catch (error) {
            console.error(error);
            await interaction.reply({ content: "Error retrieving command details.", ephemeral: true });
        }
    }
}
