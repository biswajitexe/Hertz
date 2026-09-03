import { ChatInputCommandInteraction, SlashCommandBuilder, OAuth2Scopes, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { Database } from "../../database";
import * as config from "../../config";
import { V2Embed } from "../../utilities/componentV2";

export const command = new SlashCommandBuilder()
    .setName('invite')
    .setDescription('Get the bot\'s invite link');

export async function run(interaction: ChatInputCommandInteraction, database: Database) {
    const inviteLink = interaction.client.generateInvite({
        scopes: [OAuth2Scopes.Bot, OAuth2Scopes.ApplicationsCommands],
        permissions: [
            PermissionFlagsBits.Administrator
        ]
    });

    const embed = new V2Embed()
        .setColor(config.colors.primary)
        .setTitle('Invite Hertz Security!')
        .setDescription(`Click below to add me to your server.\n\nI recommend **Administrator** permissions for full functionality (Antinuke, AutoMod, Moderation, etc.).`)
        .setFooter(`Requested by ${interaction.user.tag}`, interaction.user.displayAvatarURL());

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setLabel("Invite Me")
            .setStyle(ButtonStyle.Link)
            .setURL(inviteLink)
    );

    await interaction.reply(embed.toPayload({ extraComponents: [row] }));
}
