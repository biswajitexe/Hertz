import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Database } from "../../database";
import * as config from "../../config";
import { V2Embed, createErrorV2 } from "../../utilities/componentV2";

export const command = new SlashCommandBuilder()
    .setName('afk')
    .setDescription('Set your AFK status')
    .addStringOption(option =>
        option.setName('reason')
            .setDescription('Reason for being AFK')
            .setRequired(false)
    );

export async function run(interaction: ChatInputCommandInteraction, database: Database) {
    if (!interaction.guild) return;

    const reason = interaction.options.getString('reason');
    const guildData = await database.retrieveGuild(interaction.guild.id);
    if (!guildData) return interaction.reply(createErrorV2("Database error.").toPayload({ ephemeral: true }));

    if (!guildData.afk) guildData.afk = {};

    guildData.afk[interaction.user.id] = {
        reason: reason || "AFK",
        timestamp: Date.now()
    };

    await database.insertGuild(interaction.guild.id, guildData);

    const embed = new V2Embed()
        .setColor(config.colors.default)
        .setTitle(`${config.emojis.correct} AFK Set`)
        .setDescription(`> Successfully set your AFK status.\n\n• **User:** ${interaction.user.username}\n• **Reason:** ${reason || "AFK"}`)
        .setFooter(`Requested by ${interaction.user.username}! | Powered by Hertz`);

    await interaction.reply(embed.toPayload());
}
