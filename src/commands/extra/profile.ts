
import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, ActivityType, User } from "discord.js";
import { Database } from "../../database";
import * as config from "../../config";

export const command = new SlashCommandBuilder()
    .setName('profile')
    .setDescription('View user profile with premium aesthetics')
    .addUserOption(option => option.setName('user').setDescription('The user to view').setRequired(false));

export const aliases = ['pr'];

// Helper function to generate Embed and Components
async function getProfileData(interaction: ChatInputCommandInteraction, targetUser: User, database: Database) {
    // Force fetch member to ensure real-time presence (crucial for auto-update)
    const member = await interaction.guild?.members.fetch({ user: targetUser.id, force: true }).catch(() => null);
    
    // Fetch Data
    let userProfile = await database.getUser(targetUser.id);
    const safeProfile = userProfile || {
        id: targetUser.id, bio: null, reps: 0, lastRepDate: 0, partnerId: null, marryDate: null, color: null
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
        const customStatus = member.presence.activities.find(act => act.type === 4);
        if (customStatus && customStatus.state) statusText = customStatus.state;
    }

    // --- Activity Logic (Spotify Only) ---
    // Single newline to reduce spacing gap as requested
    let activityStatus = "\n**Activity**\n> Not listening to Spotify.";
    let activityImage = null;
    let activityUrl = null;

    if (member && member.presence) {
        const activities = member.presence.activities;
        const spotify = activities.find(act => act.name === 'Spotify' || act.type === ActivityType.Listening);

        if (spotify) {
            const trackName = spotify.details;
            const artist = spotify.state;
            const album = spotify.assets?.largeText;
            activityImage = spotify.assets?.largeImageURL();
            activityUrl = `https://open.spotify.com/search/${encodeURIComponent(trackName + " " + artist)}`;
            // Single newline for compact spacing
            activityStatus = `\n**<:35248spotify:1466417623842689100> Spotify**\n> **Song:** ${trackName}\n> **Artist:** ${artist}\n> **Album:** ${album || "Unknown"}`;
        }
    }

    // --- Embed Construction ---
    const embed = new EmbedBuilder()
        .setColor(safeProfile.color || config.colors.primary)
        .setAuthor({ name: `${targetUser.username}'s Profile`, iconURL: targetUser.displayAvatarURL() })
        // Use Use Activity Image as thumbnail if available, else User Avatar
        .setThumbnail(activityImage || targetUser.displayAvatarURL({ size: 1024 }))
        .setDescription(
            `**Badges**\n> ${badgesString}\n\n` +
            `**Status**\n> ${statusText}\n` +
            `${activityStatus}`
        )
        .setFooter({ text: `Requested by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
        .setTimestamp();

    // --- Buttons ---
    const row = new ActionRowBuilder<ButtonBuilder>();
    const avatarBtn = new ButtonBuilder().setLabel('Avatar').setStyle(ButtonStyle.Link).setURL(targetUser.displayAvatarURL({ size: 1024 }));
    row.addComponents(avatarBtn);

    const fetchedUser = await targetUser.fetch();
    if (fetchedUser.bannerURL()) {
        const bannerBtn = new ButtonBuilder().setLabel('Banner').setStyle(ButtonStyle.Link).setURL(fetchedUser.bannerURL({ size: 1024 })!);
        row.addComponents(bannerBtn);
    }

    if (activityUrl) {
        const activityBtn = new ButtonBuilder().setLabel(activityUrl.includes('spotify') ? 'Play on Spotify' : 'View Activity').setStyle(ButtonStyle.Link).setURL(activityUrl);
        row.addComponents(activityBtn);
    }

    return { embed, row };
}

export async function run(interaction: ChatInputCommandInteraction, database: Database) {
    if (!interaction.inCachedGuild()) return;
    await interaction.deferReply();

    const targetUser = interaction.options.getUser('user') || interaction.user;

    // Initial Send
    const { embed, row } = await getProfileData(interaction, targetUser, database);
    await interaction.editReply({ embeds: [embed], components: [row] });

    // Auto-Update Loop (Runs every 5 seconds for 60 seconds)
    const interval = setInterval(async () => {
        try {
            const newData = await getProfileData(interaction, targetUser, database);
            // Check if message is still editable (not deleted) - tough to check perfectly without fetch, but editReply usually throws if unknown interaction.
            // Using editReply on the deferred interaction is valid for 15 mins.
            await interaction.editReply({ embeds: [newData.embed], components: [newData.row] });
        } catch (e) {
            clearInterval(interval); // Stop if error (e.g. message deleted)
        }
    }, 5000);

    // Stop after 60 seconds to respect rate limits and resources
    setTimeout(() => {
        clearInterval(interval);
    }, 60000);
}
