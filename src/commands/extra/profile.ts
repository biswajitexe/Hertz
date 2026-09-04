import { ChatInputCommandInteraction, SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ActivityType, User } from "discord.js";
import { Database } from "../../database";
import * as config from "../../config";
import { V2Embed } from "../../utilities/componentV2";

export const command = new SlashCommandBuilder()
    .setName('profile')
    .setDescription('View user profile with premium aesthetics')
    .addUserOption(option => option.setName('user').setDescription('The user to view').setRequired(false));

export const aliases = ['pr'];

// Helper function to generate V2Embed and Components
async function getProfileData(interaction: ChatInputCommandInteraction, targetUser: User, database: Database) {
    const member = await interaction.guild?.members.fetch({ user: targetUser.id, force: true }).catch(() => null);
    
    let userProfile = await database.getUser(targetUser.id);
    const safeProfile = userProfile || {
        id: targetUser.id, bio: null, reps: 0, lastRepDate: 0, partnerId: null, marryDate: null, color: null
    };

    const botConfig = await database.getBotConfig();

    const badgesList: string[] = [];

    if (targetUser.id === process.env.OWNER_ID || botConfig.ownerUsers?.includes(targetUser.id)) {
        badgesList.push(`${config.emojis.owner} **Owner**`);
    }

    if (botConfig.developerUsers?.includes(targetUser.id)) {
        badgesList.push(`${config.emojis.developer} **Developer**`);
    }

    if (botConfig.adminUsers?.includes(targetUser.id)) {
        badgesList.push(`${config.emojis.admin} **Admin**`);
    }

    if (botConfig.staffUsers?.includes(targetUser.id)) {
        badgesList.push(`${config.emojis.staff} **Staff**`);
    }

    if (botConfig.vipUsers?.includes(targetUser.id)) {
        badgesList.push(`${config.emojis.vip} **VIP**`);
    }

    if (botConfig.partnerUsers?.includes(targetUser.id)) {
        badgesList.push(`${config.emojis.partner} **Partner**`);
    }

    if (botConfig.premiumUsers?.includes(targetUser.id)) {
        badgesList.push(`${config.emojis.noprefix} **Premium User**`);
    }

    if (botConfig.noPrefixUsers?.includes(targetUser.id)) {
        badgesList.push(`${config.emojis.noprefix} **No Prefix**`);
    }

    if (botConfig.supporterUsers?.includes(targetUser.id)) {
        badgesList.push(`${config.emojis.supporter} **Supporter**`);
    }

    const badgesString = badgesList.length > 0 ? badgesList.join("\n> ") : "None";

    let statusText = "No status set.";
    if (member && member.presence) {
        const customStatus = member.presence.activities.find(act => act.type === 4);
        if (customStatus && customStatus.state) statusText = customStatus.state;
    }

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
            activityStatus = `\n**${config.emojis.link} Spotify**\n> **Song:** ${trackName}\n> **Artist:** ${artist}\n> **Album:** ${album || "Unknown"}`;
        }
    }

    const card = new V2Embed()
        .setColor(safeProfile.color || config.colors.default)
        .setTitle(`${targetUser.username}'s Profile`)
        .setThumbnail(activityImage || targetUser.displayAvatarURL({ size: 1024 }))
        .setDescription(
            `**Badges**\n> ${badgesString}\n\n` +
            `**Status**\n> ${statusText}\n` +
            `${activityStatus}`
        )
        .setFooter(`Requested by ${interaction.user.username}! | Powered by Hertz`);

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

    return { card, row };
}

export async function run(interaction: ChatInputCommandInteraction, database: Database) {
    if (!interaction.inCachedGuild()) return;
    await interaction.deferReply();

    const targetUser = interaction.options.getUser('user') || interaction.user;

    // Initial Send
    const { card, row } = await getProfileData(interaction, targetUser, database);
    await interaction.editReply(card.toPayload({ extraComponents: [row] }));

    // Auto-Update Loop
    const interval = setInterval(async () => {
        try {
            const newData = await getProfileData(interaction, targetUser, database);
            await interaction.editReply(newData.card.toPayload({ extraComponents: [newData.row] }));
        } catch (e) {
            clearInterval(interval);
        }
    }, 5000);

    setTimeout(() => {
        clearInterval(interval);
    }, 60000);
}
