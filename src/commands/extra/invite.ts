
import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder, OAuth2Scopes, PermissionFlagsBits } from "discord.js";
import { Database } from "../../database";
import * as config from "../../config";

export const command = new SlashCommandBuilder()
    .setName('invite')
    .setDescription('Get the bot\'s invite link');

export async function run(interaction: ChatInputCommandInteraction, database: Database) {
    const inviteLink = interaction.client.generateInvite({
        scopes: [OAuth2Scopes.Bot, OAuth2Scopes.ApplicationsCommands],
        permissions: [
            PermissionFlagsBits.Administrator // Requesting Admin for full features
        ]
    });

    const embed = new EmbedBuilder()
        .setColor(0x2B2D31)
        .setTitle('Invite Me!')
        .setDescription(`[Click here to invite me to your server](${inviteLink})\n\nI need **Administrator** permissions for full functionality (Moderation, Antiraid, etc.).`)
        .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });

    await interaction.reply({ embeds: [embed] });
}
