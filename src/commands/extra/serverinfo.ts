import { ChatInputCommandInteraction, SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, ComponentType, GuildVerificationLevel, GuildExplicitContentFilter, GuildMFALevel, GuildFeature, GuildPremiumTier } from "discord.js";
import { Database } from "../../database";
import * as config from "../../config";
import { V2Embed, createErrorV2 } from "../../utilities/componentV2";

export const command = new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('Display detailed server information with categorized pages');

export const aliases = ["si", "server"];

export async function run(interaction: ChatInputCommandInteraction, database: Database) {
    if (!interaction.guild) return interaction.reply(createErrorV2("This command can only be used in a server.").toPayload({ ephemeral: true }));

    const guild = interaction.guild;
    const owner = await guild.fetchOwner().catch(() => null);

    // --- Helper to Generate V2Embed for each Page ---
    const generateEmbed = (page: string) => {
        const embed = new V2Embed()
            .setColor(config.colors.primary)
            .setAuthor(guild.name, guild.iconURL() || undefined)
            .setThumbnail(guild.iconURL({ size: 4096 }))
            .setFooter(`Requested by ${interaction.user.tag} • Page: ${page}`, interaction.user.displayAvatarURL())
            .setTimestamp();

        if (guild.bannerURL()) embed.setImage(guild.bannerURL({ size: 4096 })!);

        switch (page) {
            case 'General':
                const verificationMap: Record<number, string> = {
                    [GuildVerificationLevel.None]: "None",
                    [GuildVerificationLevel.Low]: "Low",
                    [GuildVerificationLevel.Medium]: "Medium",
                    [GuildVerificationLevel.High]: "High",
                    [GuildVerificationLevel.VeryHigh]: "Highest"
                };

                const mfaMap: Record<number, string> = {
                    [GuildMFALevel.None]: "None",
                    [GuildMFALevel.Elevated]: "Elevated (2FA Required)"
                };

                const explicitMap: Record<number, string> = {
                    [GuildExplicitContentFilter.Disabled]: "Disabled",
                    [GuildExplicitContentFilter.MembersWithoutRoles]: "Members without Roles",
                    [GuildExplicitContentFilter.AllMembers]: "All Members"
                };

                embed.setTitle("<:iconfolder:1458160174815514670> Server Profile")
                    .addFields(
                        {
                            name: "Identity",
                            value: [
                                `${config.emojis.dot} **Name:** ${guild.name}`,
                                `${config.emojis.dot} **ID:** \`${guild.id}\``,
                                `${config.emojis.dot} **Owner:** ${owner ? `${owner.user} (\`${owner.user.tag}\`)` : "Unknown"}`,
                                `${config.emojis.dot} **Description:** ${guild.description || "None"}`
                            ].join("\n"),
                            inline: false
                        },
                        {
                            name: "Server Configuration",
                            value: [
                                `${config.emojis.dot} **Preferred Locale:** ${guild.preferredLocale}`,
                                `${config.emojis.dot} **System Channel:** ${guild.systemChannel ? guild.systemChannel.toString() : "None"}`,
                                `${config.emojis.dot} **Rules Channel:** ${guild.rulesChannel ? guild.rulesChannel.toString() : "None"}`,
                                `${config.emojis.dot} **AFK Channel:** ${guild.afkChannel ? `${guild.afkChannel.toString()} (${guild.afkTimeout / 60} min)` : "None"}`
                            ].join("\n"),
                            inline: false
                        },
                        {
                            name: "Security & Safety",
                            value: [
                                `${config.emojis.dot} **Verification:** ${verificationMap[guild.verificationLevel]}`,
                                `${config.emojis.dot} **Explicit Filter:** ${explicitMap[guild.explicitContentFilter]}`,
                                `${config.emojis.dot} **2FA Requirement:** ${mfaMap[guild.mfaLevel]}`,
                                `${config.emojis.dot} **Notifications:** ${guild.defaultMessageNotifications === 0 ? "All Messages" : "Only Mentions"}`
                            ].join("\n"),
                            inline: false
                        },
                        {
                            name: "Timeline",
                            value: [
                                `${config.emojis.dot} **Created:** <t:${Math.floor(guild.createdTimestamp / 1000)}:F>`,
                                `${config.emojis.dot} **Relative:** <t:${Math.floor(guild.createdTimestamp / 1000)}:R>`
                            ].join("\n"),
                            inline: false
                        }
                    );
                break;

            case 'Members':
                const total = guild.memberCount;
                const humans = guild.members.cache.filter(m => !m.user.bot).size;
                const bots = guild.members.cache.filter(m => m.user.bot).size;

                let maxUpload = "25MB";
                if (guild.premiumTier === GuildPremiumTier.Tier2) maxUpload = "50MB";
                if (guild.premiumTier === GuildPremiumTier.Tier3) maxUpload = "100MB";

                embed.setTitle("<:Member1:1459604921451020472> Members & Stats")
                    .addFields(
                        {
                            name: "Member Counts",
                            value: [
                                `${config.emojis.dot} **Total Members:** ${total.toLocaleString()}`,
                                `${config.emojis.dot} **Humans:** ${humans.toLocaleString()}`,
                                `${config.emojis.dot} **Bots:** ${bots.toLocaleString()}`
                            ].join("\n"),
                            inline: false
                        },
                        {
                            name: "Boost Status",
                            value: [
                                `${config.emojis.dot} **Level:** Tier ${guild.premiumTier}`,
                                `${config.emojis.dot} **Count:** ${guild.premiumSubscriptionCount || 0} Boosts`
                            ].join("\n"),
                            inline: false
                        },
                        {
                            name: "Server Limits (Premium)",
                            value: [
                                `${config.emojis.dot} **Max Upload:** ${maxUpload}`,
                                `${config.emojis.dot} **Max Emoji Slots:** ${getEmojiLimit(guild.premiumTier)}`,
                                `${config.emojis.dot} **Max Sticker Slots:** ${getStickerLimit(guild.premiumTier)}`,
                                `${config.emojis.dot} **Video Quality:** ${guild.premiumTier >= GuildPremiumTier.Tier1 ? "720p/60fps" : "Standard"}`
                            ].join("\n"),
                            inline: false
                        }
                    );
                break;

            case 'Channels':
                const channels = guild.channels.cache;
                const text = channels.filter(c => c.type === ChannelType.GuildText).size;
                const voice = channels.filter(c => c.type === ChannelType.GuildVoice).size;
                const categories = channels.filter(c => c.type === ChannelType.GuildCategory).size;
                const news = channels.filter(c => c.type === ChannelType.GuildAnnouncement).size;
                const stage = channels.filter(c => c.type === ChannelType.GuildStageVoice).size;
                const forum = channels.filter(c => c.type === ChannelType.GuildForum).size;

                const roleCount = guild.roles.cache.size;
                const highestRole = guild.roles.highest;
                const topRoles = guild.roles.cache
                    .filter(r => r.id !== guild.id)
                    .sort((a, b) => b.position - a.position)
                    .first(10)
                    .map(r => r.toString())
                    .join(", ");

                const emojis = guild.emojis.cache;
                const emojiPreview = emojis.size > 0
                    ? emojis.first(15).map(e => e.toString()).join(" ") + (emojis.size > 15 ? ` ...+${emojis.size - 15}` : "")
                    : "No Emojis";

                embed.setTitle("<:channel48:1459829078881468570> Channels & Assets")
                    .addFields(
                        {
                            name: "Channel Distribution",
                            value: [
                                `${config.emojis.dot} **Total:** ${channels.size}`,
                                `${config.emojis.dot} **Text:** ${text} | **Voice:** ${voice}`,
                                `${config.emojis.dot} **Categories:** ${categories} | **News:** ${news}`,
                                `${config.emojis.dot} **Stage:** ${stage} | **Forum:** ${forum}`
                            ].join("\n"),
                            inline: false
                        },
                        {
                            name: `Roles (${roleCount})`,
                            value: `**Highest:** ${highestRole}\n**Top Roles:** ${topRoles || "None"}`,
                            inline: false
                        },
                        {
                            name: `Emojis (${emojis.size}) & Stickers (${guild.stickers.cache.size})`,
                            value: emojiPreview,
                            inline: false
                        }
                    );
                break;

            case 'Features':
                const featuresList = guild.features.map(f => `\`${f.replace(/_/g, ' ')}\``).join(", ") || "None";
                const shortFeatures = featuresList.length > 1024 ? featuresList.substring(0, 1020) + "..." : featuresList;

                embed.setTitle("<:carpeunlock:1458160337789518051> Features & Extras")
                    .addFields(
                        {
                            name: "Vanity & Links",
                            value: [
                                `${config.emojis.dot} **Vanity URL:** ${guild.vanityURLCode ? `gg/${guild.vanityURLCode}` : "None"}`,
                                `${config.emojis.dot} **Banner:** ${guild.banner ? "Set" : "None"}`,
                                `${config.emojis.dot} **Splash:** ${guild.splash ? "Set" : "None"}`,
                                `${config.emojis.dot} **Discovery:** ${guild.features.includes(GuildFeature.Discoverable) ? "Enabled" : "Disabled"}`
                            ].join("\n"),
                            inline: false
                        },
                        {
                            name: "Guild Features",
                            value: shortFeatures,
                            inline: false
                        }
                    );
                break;
        }

        return embed;
    };

    // --- Buttons ---
    const getButtons = (currentPage: string, disabled: boolean = false) => {
        const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder().setCustomId('si_gen').setLabel('General').setStyle(currentPage === 'General' ? ButtonStyle.Primary : ButtonStyle.Secondary).setEmoji('1458160174815514670').setDisabled(disabled),
            new ButtonBuilder().setCustomId('si_mem').setLabel('Members').setStyle(currentPage === 'Members' ? ButtonStyle.Primary : ButtonStyle.Secondary).setEmoji('1459604921451020472').setDisabled(disabled),
            new ButtonBuilder().setCustomId('si_chn').setLabel('Channels').setStyle(currentPage === 'Channels' ? ButtonStyle.Primary : ButtonStyle.Secondary).setEmoji('1459829078881468570').setDisabled(disabled),
            new ButtonBuilder().setCustomId('si_feat').setLabel('Features').setStyle(currentPage === 'Features' ? ButtonStyle.Primary : ButtonStyle.Secondary).setEmoji('1458160337789518051').setDisabled(disabled),
        );

        const row2 = new ActionRowBuilder<ButtonBuilder>();
        if (guild.iconURL()) row2.addComponents(new ButtonBuilder().setLabel('Icon').setStyle(ButtonStyle.Link).setURL(guild.iconURL({ size: 4096 })!));
        if (guild.bannerURL()) row2.addComponents(new ButtonBuilder().setLabel('Banner').setStyle(ButtonStyle.Link).setURL(guild.bannerURL({ size: 4096 })!));
        if (guild.splashURL()) row2.addComponents(new ButtonBuilder().setLabel('Splash').setStyle(ButtonStyle.Link).setURL(guild.splashURL({ size: 4096 })!));

        return row2.components.length > 0 ? [row1, row2] : [row1];
    };

    // --- Send Initial Message ---
    const message = await interaction.reply({
        ...generateEmbed('General').toPayload({ extraComponents: getButtons('General') }),
        fetchReply: true
    });

    // --- Collector ---
    const collector = message.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 60000
    });

    collector.on('collect', async (i) => {
        if (i.user.id !== interaction.user.id) {
            await i.reply(createErrorV2("You cannot interact with this menu.").toPayload({ ephemeral: true }));
            return;
        }

        let pageName = 'General';
        if (i.customId === 'si_gen') pageName = 'General';
        if (i.customId === 'si_mem') pageName = 'Members';
        if (i.customId === 'si_chn') pageName = 'Channels';
        if (i.customId === 'si_feat') pageName = 'Features';

        await i.update(generateEmbed(pageName).toPayload({ extraComponents: getButtons(pageName) }));
    });

    collector.on('end', async () => {
        await interaction.editReply(generateEmbed('General').toPayload({ extraComponents: getButtons('General', true) })).catch(() => { });
    });
}

function getEmojiLimit(tier: GuildPremiumTier): string {
    if (tier === GuildPremiumTier.Tier1) return "100";
    if (tier === GuildPremiumTier.Tier2) return "150";
    if (tier === GuildPremiumTier.Tier3) return "250";
    return "50";
}

function getStickerLimit(tier: GuildPremiumTier): string {
    if (tier === GuildPremiumTier.Tier1) return "15";
    if (tier === GuildPremiumTier.Tier2) return "30";
    if (tier === GuildPremiumTier.Tier3) return "60";
    return "5";
}
