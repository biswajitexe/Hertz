import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Database } from "../../database";
import * as config from "../../config";
import { inspect } from "util";
import { V2Embed, createErrorV2 } from "../../utilities/componentV2";

export const command = new SlashCommandBuilder()
    .setName('eval')
    .setDescription('Evaluates arbitrary JavaScript code (Owner Only)')
    .addStringOption(option => option.setName('code').setDescription('The code to evaluate').setRequired(true));

export async function run(interaction: ChatInputCommandInteraction, database: Database) {
    const botConfig = await database.getBotConfig();
    const owners = (process.env.OWNER_ID || "").split(',').map(id => id.trim());
    if (botConfig?.ownerUsers) owners.push(...botConfig.ownerUsers);
    if (botConfig?.developerUsers) owners.push(...botConfig.developerUsers);

    if (!owners.includes(interaction.user.id)) {
        return interaction.reply(createErrorV2('Unknown command.').toPayload({ ephemeral: true }));
    }

    const code = interaction.options.getString('code', true);

    const embedStyle = (title: string, description: string | null, color: number, fields: any[]) => {
        const embed = new V2Embed()
            .setColor(color)
            .setTitle(`${config.emojis.dev} ${title}`)
            .setDescription(description || "")
            .addFields(...fields)
            .setFooter(`Requested by ${interaction.user.username}! | Powered by Hertz`);
        return embed;
    };

    try {
        let evaled = eval(code);

        if (evaled instanceof Promise) evaled = await evaled;

        let output = inspect(evaled, { depth: 0 });
        if (output.length > 2000) output = output.slice(0, 1990) + "...";

        const embed = embedStyle('Evaluation Successful', null, config.colors.default, [
            { name: 'Input', value: `> \`\`\`js\n${code}\n\`\`\`` },
            { name: 'Output', value: `> \`\`\`js\n${output}\n\`\`\`` }
        ]);

        await interaction.reply(embed.toPayload({ ephemeral: true }));

    } catch (error: any) {
        const embed = embedStyle('Evaluation Failed', null, config.colors.error, [
            { name: 'Input', value: `> \`\`\`js\n${code}\n\`\`\`` },
            { name: 'Error', value: `> \`\`\`js\n${error.message}\n\`\`\`` }
        ]);

        await interaction.reply(embed.toPayload({ ephemeral: true }));
    }
}
