import { ChatInputCommandInteraction, SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { Database } from "../../database";
import * as config from "../../config";
import { snipeCache } from "../../structures/SnipeManager";
import { V2Embed, createErrorV2 } from "../../utilities/componentV2";

export const command = new SlashCommandBuilder()
    .setName('snipeall')
    .setDescription('Show a list of recently deleted messages in this channel.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages);

export async function run(interaction: ChatInputCommandInteraction, database: Database) {
    const snipes = snipeCache.get(interaction.channelId);

    if (!snipes || snipes.length === 0) {
        return interaction.reply(createErrorV2("There is nothing to snipe here!").toPayload({ ephemeral: true }));
    }

    const embed = new V2Embed()
        .setColor(config.colors.default)
        .setTitle(`Recently Deleted Messages`)
        .setFooter(`Requested by ${interaction.user.username}! | Powered by Hertz`);

    let description = `> Deleted message history in <#${interaction.channelId}>.\n\n`;
    const displaySnipes = snipes.slice(0, 10);

    displaySnipes.forEach((data, index) => {
        const time = Math.floor(data.timestamp / 1000);
        const content = data.content ? (data.content.length > 50 ? data.content.substring(0, 50) + "..." : data.content) : "[Image/Attachment]";

        description += `• **${index + 1}.** <t:${time}:R> **${data.authorTag}**: ${content}\n`;
    });

    embed.setDescription(description);

    await interaction.reply(embed.toPayload());
}
