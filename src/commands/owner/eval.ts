
import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { Database } from "../../database";
import * as config from "../../config";
import { inspect } from "util";

export const command = new SlashCommandBuilder()
    .setName('eval')
    .setDescription('Evaluates arbitrary JavaScript code (Owner Only)')
    .addStringOption(option => option.setName('code').setDescription('The code to evaluate').setRequired(true));

export async function run(interaction: ChatInputCommandInteraction, database: Database) {
    // Hidden execution check
    if (interaction.user.id !== process.env.OWNER_ID) {
        return interaction.reply({ content: `🚫 Unknown command.`, ephemeral: true });
        // Fake "Unknown command" regarding user perception or just silent fail
    }

    const code = interaction.options.getString('code', true);

    try {
        let evaled = eval(code);

        if (evaled instanceof Promise) evaled = await evaled;

        let output = inspect(evaled, { depth: 0 });
        if (output.length > 2000) output = output.slice(0, 1990) + "...";

        const embed = new EmbedBuilder()
            .setColor(config.colors.success)
            .setTitle('Evaluation Successful')
            .addFields(
                { name: 'Input', value: `\`\`\`js\n${code}\n\`\`\`` },
                { name: 'Output', value: `\`\`\`js\n${output}\n\`\`\`` }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });

    } catch (error: any) {
        const embed = new EmbedBuilder()
            .setColor(config.colors.error)
            .setTitle('Evaluation Failed')
            .addFields(
                { name: 'Input', value: `\`\`\`js\n${code}\n\`\`\`` },
                { name: 'Error', value: `\`\`\`js\n${error.message}\n\`\`\`` }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
}
