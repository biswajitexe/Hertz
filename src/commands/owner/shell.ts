
import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { Database } from "../../database";
import * as config from "../../config";
import { exec } from "child_process";

export const command = new SlashCommandBuilder()
    .setName('shell')
    .setDescription('Execute terminal commands (Owner Only)')
    .addStringOption(option => option.setName('cmd').setDescription('Command to run').setRequired(true));

export async function run(interaction: ChatInputCommandInteraction, database: Database) {
    if (interaction.user.id !== process.env.OWNER_ID) {
        return interaction.reply({ content: `🚫 Unknown command.`, ephemeral: true });
    }

    const cmd = interaction.options.getString('cmd', true);
    await interaction.deferReply({ ephemeral: true });

    exec(cmd, (error, stdout, stderr) => {
        const output = stdout || stderr || "No output.";

        // Truncate if too long
        const cleanOutput = output.length > 4000 ? output.substring(0, 4000) + '...' : output;

        const embed = new EmbedBuilder()
            .setColor(error ? config.colors.error : config.colors.success)
            .setDescription(`**<:74658vipglow:1465051133704798435> ${error ? 'Shell Error' : 'Shell Success'}**\n\n> \`\`\`bash\n${cleanOutput}\n\`\`\``)
            .setThumbnail(interaction.client.user?.displayAvatarURL() || null)
            .setFooter({ text: `Requested by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });

        interaction.editReply({ embeds: [embed] });
    });
}
