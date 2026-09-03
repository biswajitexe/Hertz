import { ChatInputCommandInteraction, SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { Database } from "../../database";
import * as config from "../../config";
import { snipeCache } from "../../structures/SnipeManager";
import { V2Embed, createErrorV2 } from "../../utilities/componentV2";

export const command = new SlashCommandBuilder()
    .setName('snipe')
    .setDescription('Recover the last deleted message in this channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages);

export async function run(interaction: ChatInputCommandInteraction, database: Database) {
    const snipes = snipeCache.get(interaction.channelId);

    if (!snipes || snipes.length === 0) {
        return interaction.reply(createErrorV2("There is nothing to snipe here!").toPayload({ ephemeral: true }));
    }

    const data = snipes[0];

    const embed = new V2Embed()
        .setColor(config.colors.primary)
        .setAuthor(data.authorTag, data.authorAvatar || undefined)
        .setDescription(data.content || "*No content (Image only)*")
        .setFooter(`Sniped by ${interaction.user.tag} | Deleted`);

    if (data.image) {
        embed.setImage(data.image);
    }

    await interaction.reply(embed.toPayload());
}
