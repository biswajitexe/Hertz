import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Database } from "../../database";
import * as config from "../../config";
import { exec } from "child_process";
import { V2Embed, createErrorV2 } from "../../utilities/componentV2";

export const command = new SlashCommandBuilder()
    .setName('shell')
    .setDescription('Execute terminal commands (Owner Only)')
    .addStringOption(option => option.setName('cmd').setDescription('Command to run').setRequired(true));

export async function run(interaction: ChatInputCommandInteraction, database: Database) {
    const botConfig = await database.getBotConfig();
    const owners = (process.env.OWNER_ID || "").split(',').map(id => id.trim());
    if (botConfig?.ownerUsers) owners.push(...botConfig.ownerUsers);
    if (botConfig?.developerUsers) owners.push(...botConfig.developerUsers);

    if (!owners.includes(interaction.user.id)) {
        return interaction.reply(createErrorV2('Unknown command.').toPayload({ ephemeral: true }));
    }

    const cmd = interaction.options.getString('cmd', true);
    await interaction.deferReply({ ephemeral: true });

    exec(cmd, (error, stdout, stderr) => {
        const output = stdout || stderr || "No output.";
        const cleanOutput = output.length > 4000 ? output.substring(0, 4000) + '...' : output;

        const embed = new V2Embed()
            .setColor(config.colors.default)
            .setTitle(`${error ? config.emojis.wrong : config.emojis.correct} ${error ? 'Shell Error' : 'Shell Success'}`)
            .setDescription(`> \`\`\`bash\n${cleanOutput}\n\`\`\``)
            .setFooter(`Requested by ${interaction.user.username}! | Powered by Hertz`);

        interaction.editReply(embed.toPayload());
    });
}
