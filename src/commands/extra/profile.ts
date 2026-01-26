
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
    if (botConfig.premiumUsers.includes(targetUser.id)) badgesList.push(config.emojis.noprefix); // Premium
    if (botConfig.noPrefixUsers?.includes(targetUser.id)) badgesList.push(config.emojis.staff); // No Prefix / Staff
    if (member && member.permissions.has("Administrator")) badgesList.push(config.emojis.admin);

    const badgesString = badgesList.length > 0 ? badgesList.join(" ") : "None";

    // --- Partner Logic ---
    let partnerString = "No Partner 💔";
    if (safeProfile.partnerId) {
        const partner = await interaction.client.users.fetch(safeProfile.partnerId).catch(() => null);
        if (partner) {
            const date = safeProfile.marryDate ? `<t:${Math.floor(safeProfile.marryDate / 1000)}:R>` : "Unknown date";
            partnerString = `Married to **${partner.username}** 💍\n> Since: ${date}`;
        }
    }

    // --- Spotify & Status Logic ---
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
            `> **About Me**\n> ${safeProfile.bio || "No bio set. Use `/bio` to set one!"}` +
            `${spotifyStatus}` // Append Spotify info if exists
        )
        .addFields(
            { name: "❤️ Likes", value: `> **${safeProfile.reps}**`, inline: true },
            { name: "💍 Partner", value: `> ${partnerString.replace('Married to ', '').replace(/\n.*/, '')}`, inline: true } // Simplified for field
        )
        .setFooter({ text: `Requested by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
        .setTimestamp();

    if (spotifyImage) {
        embed.setImage(spotifyImage); // Show Album Art prominently
    }

    // --- Buttons ---
    const row = new ActionRowBuilder<ButtonBuilder>();

    // Rep Button
    const repBtn = new ButtonBuilder()
        .setCustomId(`rep_${targetUser.id}`)
        .setLabel('Likes +')
        .setEmoji('❤️')
        .setStyle(ButtonStyle.Danger); // Red for heart

    // Avatar Button
    const avatarBtn = new ButtonBuilder()
        .setLabel('Avatar')
        .setStyle(ButtonStyle.Link)
        .setURL(targetUser.displayAvatarURL({ size: 1024 }));

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

    row.addComponents(repBtn, avatarBtn);

    if (spotifyUrl) {
        const spotifyBtn = new ButtonBuilder()
            .setLabel('Play on Spotify')
            .setStyle(ButtonStyle.Link)
            .setURL(spotifyUrl);
        row.addComponents(spotifyBtn);
    }

    // --- Send Reply ---
    const msg = await interaction.editReply({ embeds: [embed], components: [row] });

    // --- Collector for Reputation ---
    const collector = msg.createMessageComponentCollector({ componentType: ComponentType.Button, time: 60000 });

    collector.on('collect', async i => {
        if (i.customId === `rep_${targetUser.id}`) {
            // Rep Logic
            if (i.user.id === targetUser.id) {
                await i.reply({ content: `${config.emojis.error} You cannot give reputation to yourself!`, ephemeral: true });
                return;
            }

            // Cooldown check could go here (using Database/Cache)
            // For now, simple increment

            // Check cooldown (Local map or DB) - implementing simple daily check logic requires DB update
            const now = Date.now();
            const giverProfile = await database.getUser(i.user.id); // Get Giver

            const COOLDOWN = 12 * 60 * 60 * 1000; // 12 Hours
            if (giverProfile && (now - giverProfile.lastRepDate) < COOLDOWN) {
                const remaining = COOLDOWN - (now - giverProfile.lastRepDate);
                const hours = Math.floor(remaining / 3600000);
                const minutes = Math.floor((remaining % 3600000) / 60000);
                await i.reply({ content: `${config.emojis.error} You can give a like again in **${hours}h ${minutes}m**.`, ephemeral: true });
                return;
            }

            // Apply Rep
            safeProfile.reps += 1;
            await database.updateUser(safeProfile); // Update receiver

            // Update giver cooldown
            if (giverProfile) {
                giverProfile.lastRepDate = now;
                await database.updateUser(giverProfile);
            } else {
                // Create giver if not exists (Should be handled by getUser but being safe)
                await database.updateUser({
                    id: i.user.id,
                    bio: null,
                    reps: 0,
                    lastRepDate: now,
                    partnerId: null,
                    marryDate: null,
                    color: null
                });
            }

            await i.reply({ content: `${config.emojis.success} You gave **+1 Like** to **${targetUser.username}**!`, ephemeral: true });

            // Refresh Embed
            const newFieldVal = `> **${safeProfile.reps}**`;
            // Rebuild embed logic or just update field
            // Simplest is to edit the message's embed
            const newEmbed = EmbedBuilder.from(embed);
            // We know Rep is field index 0 based on construction
            const fields = newEmbed.data.fields;
            if (fields && fields[0]) fields[0].value = newFieldVal;

            await interaction.editReply({ embeds: [newEmbed] });
        }
    });

    collector.on('end', () => {
        // Disable Rep button after timeout
        const disabledRow = new ActionRowBuilder<ButtonBuilder>();
        row.components.forEach(c => {
            // Reconstruct button to disable
            // Need to type check or use raw JSON if rebuilding from existing component
            const btn = ButtonBuilder.from(c as any);
            if (btn.data.style !== ButtonStyle.Link) btn.setDisabled(true);
            disabledRow.addComponents(btn);
        });

        interaction.editReply({ components: [disabledRow] }).catch(() => { });
    });
}
