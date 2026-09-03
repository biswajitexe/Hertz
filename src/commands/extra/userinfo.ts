import { ChatInputCommandInteraction, SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } from "discord.js";
import { Database } from "../../database";
import * as config from "../../config";
import { V2Embed } from "../../utilities/componentV2";

export const command = new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Display detailed information about a user')
    .addUserOption(option =>
        option.setName('target')
            .setDescription('The user to get info for')
            .setRequired(false)
    );

export const aliases = ["ui"];

export async function run(interaction: ChatInputCommandInteraction, database: Database) {
    const rawUser = interaction.options.getUser('target') || interaction.user;
    const user = await interaction.client.users.fetch(rawUser.id, { force: true });

    const member = interaction.guild?.members.cache.get(user.id);
    const targetMember = member || (interaction.guild ? await interaction.guild.members.fetch(user.id).catch(() => null) : null);

    const embed = new V2Embed()
        .setColor(config.colors.primary)
        .setAuthor(user.username, user.displayAvatarURL())
        .setThumbnail(user.displayAvatarURL({ size: 4096 }))
        .setFooter(`Requested by ${interaction.user.tag}`, interaction.user.displayAvatarURL())
        .setTimestamp();

    // User Info Section
    const userInfoParts = [
        `${config.emojis.dot} **Display Name:** ${user.globalName || user.username}`,
        `${config.emojis.dot} **Created:** <t:${Math.floor(user.createdTimestamp / 1000)}:R>`,
        `${config.emojis.dot} **Bot:** ${user.bot ? config.emojis.success : config.emojis.error}`,
    ];

    embed.addFields({
        name: `${config.emojis.user || "👤"} User Details`,
        value: userInfoParts.join("\n"),
        inline: false
    });

    if (targetMember) {
        const roles = targetMember.roles.cache
            .filter(r => r.id !== interaction.guildId)
            .sort((a, b) => b.position - a.position);

        const roleString = roles.size > 0
            ? roles.map(r => r.toString()).slice(0, 5).join(", ") + (roles.size > 5 ? ` +${roles.size - 5} more` : "")
            : "No roles";

        const acknowledgements = [];
        if (targetMember.permissions.has(PermissionFlagsBits.Administrator)) acknowledgements.push("Administrator");
        else if (targetMember.permissions.has(PermissionFlagsBits.ManageGuild)) acknowledgements.push("Server Manager");
        else if (targetMember.permissions.has(PermissionFlagsBits.ManageMessages)) acknowledgements.push("Moderator");

        if (interaction.guild?.ownerId === user.id) acknowledgements.unshift("Server Owner 👑");

        const boosterStatus = targetMember.premiumSince
            ? `${config.emojis.success} <t:${Math.floor(targetMember.premiumSinceTimestamp! / 1000)}:R>`
            : `${config.emojis.error}`;

        embed.addFields(
            {
                name: `${config.emojis.member || "🛡️"} Member Details`,
                value: [
                    `${config.emojis.dot} **Joined:** <t:${Math.floor(targetMember.joinedTimestamp! / 1000)}:R>`,
                    `${config.emojis.dot} **Nickname:** ${targetMember.nickname || "None"}`,
                    `${config.emojis.dot} **Highest Role:** ${targetMember.roles.highest.id === interaction.guildId ? "None" : targetMember.roles.highest}`,
                    `${config.emojis.dot} **Booster:** ${boosterStatus}`,
                    `${config.emojis.dot} **Permissions:** ${acknowledgements.length > 0 ? acknowledgements.join(", ") : "Regular Member"}`,
                ].join("\n"),
                inline: false
            }
        );
    } else {
        embed.addFields({
            name: "Note",
            value: `${config.emojis.warning} User is not in this server.`,
            inline: false
        });
    }

    if (user.bannerURL()) {
        embed.setImage(user.bannerURL({ size: 4096 }) as string);
    }

    // Buttons
    const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
            new ButtonBuilder()
                .setLabel('Avatar')
                .setStyle(ButtonStyle.Link)
                .setURL(user.displayAvatarURL({ size: 4096 })),
        );

    if (user.bannerURL()) {
        row.addComponents(
            new ButtonBuilder()
                .setLabel('Banner')
                .setStyle(ButtonStyle.Link)
                .setURL(user.bannerURL({ size: 4096 })!)
        );
    }

    await interaction.reply(embed.toPayload({ extraComponents: [row] }));
}
