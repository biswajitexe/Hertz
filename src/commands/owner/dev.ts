import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
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
        // For Slash Commands, we must reply or it fails. 
        // But the user requested "ignore". 
        // Best approach for slash: Ephemeral "Unknown command" or similar generic error to fake it, 
        // OR just ephemeral "You are not allowed". 
        // Given the requirement "ignore", we can just return. 
        // But Discord API will timeout the interaction if we don't reply. 
        // We will just return if it's a message-based prefix command.
        // If it's an actual interaction, we might have to reply ephemeral.
        // Since this bot uses a hybrid handler, let's assume if it came from interaction, we reply ephemeral "Unknown command".
        return interaction.reply({ content: "Unknown command.", ephemeral: true });
    }

    const ownerDir = path.join(__dirname);
    const files = fs.readdirSync(ownerDir).filter(file => (file.endsWith('.ts') || file.endsWith('.js')) && !file.startsWith('dev'));

    const commands: string[] = [];

    for (const file of files) {
        try {
            const cmd = require(path.join(ownerDir, file));
            if (cmd.command && cmd.command.name) {
                const desc = cmd.command.description || "No description";
                commands.push(`\`${config.prefix}${cmd.command.name}\` - ${desc}`);
            }
        } catch (e) {
            console.error(`[Dev] Failed to load ${file}`, e);
        }
    }

    const embed = new EmbedBuilder()
        .setColor(config.colors.primary)
        .setAuthor({ name: `Hi, ${interaction.user.username}!`, iconURL: interaction.user.displayAvatarURL() })
        .setThumbnail(interaction.client.user?.displayAvatarURL() || null)
        .setDescription(`> **<:74658vipglow:1465051133704798435> Developer Control Panel**\n> **Prefix:** \`${config.prefix}\``)
        .addFields({
            name: "Owner Commands",
            value: commands.length > 0 ? commands.join('\n') : "> No commands found.",
            inline: false
        })
        .setFooter({ text: `Developed by Vasudev AI Team`, iconURL: interaction.client.user?.displayAvatarURL() || undefined })
        .setTimestamp();

    return interaction.reply({ embeds: [embed], ephemeral: true });
}
