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
        .setFooter({ text: `Xeon • Owner Commands`, iconURL: interaction.client.user?.displayAvatarURL() || undefined });

    // Replicate Help Menu Components
    const moduleOrder = ["antinuke", "automod", "moderation", "media", "giveaways", "welcomer", "extra"];

    // Select Menu
    const selectMenu = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId("help_category")
            .setPlaceholder("Choose a specific Category")
            .addOptions(moduleOrder.map(key => ({
                label: config.modules[key].name,
                emoji: config.emojis[key],
                value: `help_${key}`,
                description: config.modules[key].description.substring(0, 100)
            })))
    );

    // Buttons
    const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId("help_home").setEmoji(config.emojis.home).setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("help_delete").setEmoji(config.emojis.delete).setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId("help_all_commands").setLabel("All Commands").setEmoji(config.emojis.commands).setStyle(ButtonStyle.Primary)
    );

    // Using help_ components allows reusing the main interaction handler logic in index.ts/help.ts
    // This effectively lets the owner navigate OUT of dev panel into standard help.
    await interaction.reply({ embeds: [embed], components: [selectMenu, buttons], ephemeral: true });
}
