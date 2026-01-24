
import { ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { Database } from "../../database";
import * as config from "../../config";

export const command = new SlashCommandBuilder()
    .setName('antiinvite')
    .setDescription('Configure the anti-invite system.')
    .addSubcommand(subcommand => subcommand
        .setName('enable')
        .setDescription('Enable the anti-invite filter.')
    )
    .addSubcommand(subcommand => subcommand
        .setName('disable')
        .setDescription('Disable the anti-invite filter.')
    )
    .addSubcommand(subcommand => subcommand
        .setName('status')
        .setDescription('Check the current status of the anti-invite filter.')
    );

export async function run(interaction: ChatInputCommandInteraction, database: Database) {
    if (!interaction.inCachedGuild()) return;

    let guildData = await database.retrieveGuild(interaction.guild.id);
    if (!guildData) {
        await database.defaultGuild(interaction.guild);
        guildData = await database.retrieveGuild(interaction.guild.id);
    }
    if (!guildData) return;

    if (!guildData.extraOwners) guildData.extraOwners = [];
    if (!guildData.extraAdmins) guildData.extraAdmins = [];

    const isOwner = interaction.user.id === interaction.guild.ownerId;
    const isExtraOwner = guildData.extraOwners.includes(interaction.user.id);
    const isExtraAdmin = guildData.extraAdmins.includes(interaction.user.id);
    const isBotOwner = interaction.user.id === process.env.OWNER_ID;

    if (!isOwner && !isExtraOwner && !isExtraAdmin && !isBotOwner) {
        await interaction.reply({ content: `${config.emojis.error} **Only the Server Owner, Trustable Admins, or Bot Owner can manage anti-invite settings.**`, ephemeral: true });
        return;
    }

    const sub = interaction.options.getSubcommand();
    await interaction.deferReply();

    try {

        if (sub === 'enable') {
            if (guildData.messageFilters.discordInvites) {
                await interaction.editReply({ content: `${config.emojis.error} **Anti-Invite is already enabled!**` });
                return;
            }
            guildData.messageFilters.discordInvites = true;
            await database.insertGuild(interaction.guild.id, guildData);
            await interaction.editReply({ content: `${config.emojis.success} **Anti-Invite filter has been Enabled.**` });
        } else if (sub === 'disable') {
            if (!guildData.messageFilters.discordInvites) {
                await interaction.editReply({ content: `${config.emojis.error} **Anti-Invite is already disabled!**` });
                return;
            }
            guildData.messageFilters.discordInvites = false;
            await database.insertGuild(interaction.guild.id, guildData);
            await interaction.editReply({ content: `${config.emojis.success} **Anti-Invite filter has been DISABLED.**` });
        } else if (sub === 'status') {
            const statusEmoji = guildData.messageFilters.discordInvites ? config.emojis.success : config.emojis.error;
            const statusText = guildData.messageFilters.discordInvites ? "Enabled" : "Disabled";

            let description = `**Anti-Invite System ${statusText}.**\n\n**Active Protections:**\n> ${statusEmoji} Anti-Discord Invites`;

            if (!guildData.messageFilters.discordInvites) {
                description += `\n\n**System is currently disabled.**\nUse \`${config.prefix}antiinvite enable\` to activate security and protect your server! <:6581lockkey:1461100873479487559>`;
            }

            const embed = new EmbedBuilder()
                .setColor(config.colors.primary)
                .setDescription(`**${config.emojis.automod} Anti-Invite Panel**\n\n${description}`)
                .setThumbnail(interaction.client.user?.displayAvatarURL() || null)
                .setFooter({ text: `Requested by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });

            await interaction.editReply({ embeds: [embed] });
        } else {
            // Subcommand not found (likely prefix command empty call)
            const embed = new EmbedBuilder()
                .setColor(config.colors.primary)
                .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
                .setDescription(
                    '`?antiinvite enable`\n' +
                    '`?antiinvite disable`\n' +
                    '`?antiinvite status`'
                )
                .setThumbnail(interaction.client.user?.displayAvatarURL() || null)
                .setFooter({ text: 'Xeon • Automated Security', iconURL: interaction.client.user?.displayAvatarURL() || undefined });
            await interaction.editReply({ embeds: [embed] });
        }
    } catch (error) {
        console.error(error);
        await interaction.editReply({ content: `${config.emojis.error} **Failed to update settings.**` });
    }
}
