
import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, ActivityType } from "discord.js";
import { Database } from "../../database";
import * as config from "../../config";

export const command = new SlashCommandBuilder()
    .setName('profile')
    .setDescription('View user profile with premium aesthetics')
    .addUserOption(option => option.setName('user').setDescription('The user to view').setRequired(false));

export const aliases = ['pr'];



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
    if (targetUser.id === process.env.OWNER_ID) {
        badgesList.push(`${config.emojis.owner} **Owner**`);
        badgesList.push(`${config.emojis.developer} **Developer**`);
    } else {
        if (botConfig.premiumUsers.includes(targetUser.id)) badgesList.push(`${config.emojis.noprefix} **Premium User**`);
        if (botConfig.noPrefixUsers?.includes(targetUser.id)) badgesList.push(`<:3852diamond:1466392074189410421> **No Prefix**`);
        if (botConfig.staffUsers?.includes(targetUser.id)) badgesList.push(`${config.emojis.staff} **Staff**`);
    }
    if (member && member.permissions.has("Administrator")) badgesList.push(`${config.emojis.admin} **Admin**`);

    const badgesString = badgesList.length > 0 ? badgesList.join("\n> ") : "None";

    // --- Status Logic ---
    let statusText = "No status set.";
    if (member && member.presence) {
        const customStatus = member.presence.activities.find(act => act.type === 4); // ActivityType.Custom = 4
        if (customStatus && customStatus.state) {
            statusText = customStatus.state;
        }
    }

    // --- Activity Logic ---
    let activityStatus = "\n\n**Activity**\n> Not doing anything.";
    let activityImage = null;
    let activityUrl = null;

    if (member && member.presence) {
        // Prioritize Listening (Spotify) > Playing (Game/Code) > Streaming
        const activities = member.presence.activities;
        const spotify = activities.find(act => act.name === 'Spotify' || act.type === ActivityType.Listening);
        const playing = activities.find(act => act.type === ActivityType.Playing);
        const streaming = activities.find(act => act.type === ActivityType.Streaming);

        if (spotify) {
            const trackName = spotify.details;
            const artist = spotify.state;
            const album = spotify.assets?.largeText;
            activityImage = spotify.assets?.largeImageURL();
            activityUrl = `https://open.spotify.com/search/${encodeURIComponent(trackName + " " + artist)}`;
            activityStatus = `\n\n**<:35248spotify:1466417623842689100> Spotify**\n> **Song:** ${trackName}\n> **Artist:** ${artist}\n> **Album:** ${album || "Unknown"}`;
        } else if (playing) {
             const name = playing.name;
             const details = playing.details ? `\n> **Details:** ${playing.details}` : "";
             const state = playing.state ? `\n> **State:** ${playing.state}` : "";
             activityImage = playing.assets?.largeImageURL();
             activityStatus = `\n\n**🎮 Activity**\n> **Playing:** ${name}${details}${state}`;
        } else if (streaming) {
             activityStatus = `\n\n**📡 Streaming**\n> **Stream:** ${streaming.name}`;
             if (streaming.url) activityUrl = streaming.url;
        }
    }

    // --- Embed Construction ---
    const embed = new EmbedBuilder()
        .setColor(safeProfile.color || config.colors.primary)
        .setAuthor({ name: `${targetUser.username}'s Profile`, iconURL: targetUser.displayAvatarURL() })
        // Use Activity Image as thumbnail if available (small), else User Avatar
        .setThumbnail(activityImage || targetUser.displayAvatarURL({ size: 1024 }))
        .setDescription(
            `**Badges**\n> ${badgesString}\n\n` +
            `**Status**\n> ${statusText}\n` +
            `${activityStatus}`
        )
        .setFooter({ text: `Requested by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
        .setTimestamp();

    // Removed .setImage to keep embed compact

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

    if (activityUrl) {
        const activityBtn = new ButtonBuilder()
            .setLabel(activityUrl.includes('spotify') ? 'Play on Spotify' : 'View Activity')
            .setStyle(ButtonStyle.Link)
            .setURL(activityUrl);
        row.addComponents(activityBtn);
    }

    // --- Send Reply ---
    await interaction.editReply({ embeds: [embed], components: [row] });
    // Removed Collector logic as there are no interactive buttons anymore
}
