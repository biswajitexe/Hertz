
import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, ActivityType } from "discord.js";
import { Database } from "../../database";
import * as config from "../../config";

export const command = new SlashCommandBuilder()
    .setName('profile')
    .setDescription('View user profile with premium aesthetics')
    .addUserOption(option => option.setName('user').setDescription('The user to view').setRequired(false));



export async function run(interaction: ChatInputCommandInteraction, database: Database) {
    if (!interaction.inCachedGuild()) return;

    await interaction.deferReply();

    const targetUser = interaction.options.getUser('user') || interaction.user;
    const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

    // Fetch Data
    let userProfile = await database.getUser(targetUser.id);
    if (!userProfile) {
        // Init if not exists (though getUser usually handles it or returns null, assuming safe access)
    }
    // Re-fetch object to be sure (shim if database method doesn't auto-create)
    // Assuming database.getUser returns the object or undefined. 
    // If undefined, we treat as default. 
    // We will use a local default object if null.
    const safeProfile = userProfile || {
        id: targetUser.id,
        bio: null,
        reps: 0,
        lastRepDate: 0,
        partnerId: null,
        marryDate: null,
        color: null
    };

    const botConfig = await database.getBotConfig();

    // --- Badges Logic ---
    const badgesList: string[] = [];
    if (targetUser.id === process.env.OWNER_ID) badgesList.push(config.emojis.owner); // Owner
    if (botConfig.premiumUsers.includes(targetUser.id)) badgesList.push(`${config.emojis.noprefix} **Premium User**`);
    if (botConfig.noPrefixUsers?.includes(targetUser.id)) badgesList.push(`<:z_premium:1385210766457831434> **No Prefix**`);
    if (botConfig.staffUsers?.includes(targetUser.id)) badgesList.push(`${config.emojis.staff} **Staff**`);
    if (member && member.permissions.has("Administrator")) badgesList.push(config.emojis.admin);

    const badgesString = badgesList.length > 0 ? badgesList.join("\n> ") : "None";

    // --- Status Logic ---
    let statusText = "No status set.";
    if (member && member.presence) {
        const customStatus = member.presence.activities.find(act => act.type === 4); // ActivityType.Custom = 4
        if (customStatus && customStatus.state) {
            statusText = customStatus.state;
        }
    }

    // --- Spotify Logic ---
    let spotifyStatus = "\n\n**<:spotify:1380769677332058183> Spotify**\n> Not listening to anything.";
    let spotifyImage = null;
    let spotifyUrl = null;

    if (member && member.presence) {
        const spotifyActivity = member.presence.activities.find(act => act.name === 'Spotify' || act.type === ActivityType.Listening);
        if (spotifyActivity) {
            const trackName = spotifyActivity.details;
            const artist = spotifyActivity.state;
            const album = spotifyActivity.assets?.largeText;
            spotifyImage = spotifyActivity.assets?.largeImageURL();
            spotifyUrl = `https://open.spotify.com/search/${encodeURIComponent(trackName + " " + artist)}`; // Fallback search URL or syncID if available

            spotifyStatus = `\n\n**<:spotify:1380769677332058183> Spotify**\n> **Song:** ${trackName}\n> **Artist:** ${artist}\n> **Album:** ${album || "Unknown"}`;
        }
    }

    // --- Embed Construction ---
    const embed = new EmbedBuilder()
        .setColor(safeProfile.color || config.colors.primary)
        .setTitle(`<:74658vipglow:1465051133704798435> ${targetUser.username}'s Profile`)
        .setThumbnail(targetUser.displayAvatarURL({ size: 1024 }))
        .setDescription(
            `> **Badges**\n> ${badgesString}\n\n` +
            `> **About Me**\n> ${statusText}\n` +
            `${spotifyStatus}`
        )
        .setFooter({ text: `Requested by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
        .setTimestamp();

    if (spotifyImage) {
        embed.setImage(spotifyImage);
    }

    // --- Buttons ---
    const row = new ActionRowBuilder<ButtonBuilder>();

    // Avatar Button
    const avatarBtn = new ButtonBuilder()
        .setLabel('Avatar')
        .setStyle(ButtonStyle.Link)
        .setURL(targetUser.displayAvatarURL({ size: 1024 }));

    row.addComponents(avatarBtn);

    // Banner Button (only if exists, but we can't easily check null validity synchronously without fetch, discord handles empty link gracefully usually, but let's check basic prop)
    // Actually fetching user to get banner force check is expensive, assume link button is fine or omit if standard user doesn't likely have one.
    // Let's safe check: fetched user (not member) needed for banner.
    const fetchedUser = await targetUser.fetch();
    if (fetchedUser.bannerURL()) {
        const bannerBtn = new ButtonBuilder()
            .setLabel('Banner')
            .setStyle(ButtonStyle.Link)
            .setURL(fetchedUser.bannerURL({ size: 1024 })!);
        row.addComponents(bannerBtn);
    }

    if (spotifyUrl) {
        const spotifyBtn = new ButtonBuilder()
            .setLabel('Play on Spotify')
            .setStyle(ButtonStyle.Link)
            .setURL(spotifyUrl);
        row.addComponents(spotifyBtn);
    }

    // --- Send Reply ---
    await interaction.editReply({ embeds: [embed], components: [row] });
    // Removed Collector logic as there are no interactive buttons anymore
}
