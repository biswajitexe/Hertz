
import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder, User } from "discord.js";
import { Database } from "../../database";
import * as config from "../../config";

export const command = new SlashCommandBuilder()
    .setName('profile')
    .setDescription('View user profile')
    .addUserOption(option => option.setName('user').setDescription('The user to view').setRequired(false));

export async function run(interaction: ChatInputCommandInteraction, database: Database) {
    if (!interaction.inCachedGuild()) return;

    const targetUser = interaction.options.getUser('user') || interaction.user;
    const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

    const userProfile = await database.getUser(targetUser.id);
    const botConfig = await database.getBotConfig();

    // Badges Logic
    let badges = "";
    if (targetUser.id === process.env.OWNER_ID) badges += "<:icons_owner:1380786034614210610> ";
    if (botConfig.premiumUsers.includes(targetUser.id)) badges += "<:z_premium:1385210766457831434> ";
    if (botConfig.noPrefixUsers?.includes(targetUser.id)) badges += "<:z_premium:1385210766457831434> "; // Reusing premium for now or generic staff
    // Staff/Admin Check (Simple check for now)
    if (member && member.permissions.has("Administrator")) badges += "<:nashe_staff:1385197969552314500> ";
    // You can add more badges here logic-wise

    if (badges === "") badges = "None";

    // Marriage Logic
    let partnerString = "Single";
    if (userProfile.partnerId) {
        const partner = await interaction.client.users.fetch(userProfile.partnerId).catch(() => null);
        const date = userProfile.marryDate ? `<t:${Math.floor(userProfile.marryDate / 1000)}:R>` : "Unknown date";
        partnerString = `Married to **${partner ? partner.username : "Unknown User"}** 💍\n> Since: ${date}`;
    }

    // Embed Construction
    const embed = new EmbedBuilder()
        .setColor(userProfile.color || config.colors.primary)
        .setAuthor({ name: `${targetUser.username}`, iconURL: targetUser.displayAvatarURL() })
        .setThumbnail(targetUser.displayAvatarURL())
        .setDescription(`**<:32725firehonkaistarrail:1465068073143894106> ${targetUser.username}'s Profile**\n\n> **Badges**\n> ${badges}\n\n> **About Me**\n> ${userProfile.bio || "No bio set. Use `/bio` to set one!"}`)
        .addFields(
            { name: "❤️ Reputation", value: `> **${userProfile.reps}**`, inline: true },
            { name: "💍 Partner", value: `> ${partnerString.replace('Married to ', '').replace('Single', 'No Partner').replace('Missing', 'No Partner')}`, inline: true },
            { name: "📅 Joined Discord", value: `> <t:${Math.floor(targetUser.createdTimestamp / 1000)}:R>`, inline: false },
            { name: "📅 Joined Server", value: `> ${member ? `<t:${Math.floor(member.joinedTimestamp! / 1000)}:R>` : "Not in server"}`, inline: false }
        )
        .setFooter({ text: `Requested by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
        .setTimestamp();

    // Check Status (Activity) - Realtime
    // Status fetching from guild member presence
    if (member && member.presence) {
        const activity = member.presence.activities[0];
        if (activity) {
            let statusText = "";
            if (activity.name === "Spotify") statusText = `Listening to **${activity.details}** by **${activity.state}** 🎵`;
            else statusText = `${activity.type === 0 ? 'Playing' : 'Doing'} **${activity.name}**`;

            embed.addFields({ name: "🎵 Activity", value: `> ${statusText}`, inline: false });
        }
    }

    return interaction.reply({ embeds: [embed] });
}
