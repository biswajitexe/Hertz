import { ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { Database } from "../../database";
import * as config from "../../config";

export const command = new SlashCommandBuilder()
    .setName('antispam')
    .setDescription('Configure the anti-spam system.')
    .addSubcommand(subcommand => subcommand
        .setName('enable')
        .setDescription('Enable the anti-spam filter.')
    )
    .addSubcommand(subcommand => subcommand
        .setName('disable')
        .setDescription('Disable the anti-spam filter.')
    )
    .addSubcommand(subcommand => subcommand
        .setName('status')
        .setDescription('Check the current status of the anti-spam filter.')
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
        await interaction.reply({ content: `${config.emojis.error} **Only the Server Owner, Trustable Admins, or Bot Owner can manage anti-spam settings.**`, ephemeral: true });
        return;
    }

    const sub = interaction.options.getSubcommand();
    await interaction.deferReply();

    try {

        if (sub === 'enable') {
            if (guildData.messageFilters.spam) {
                await interaction.editReply({ content: `${config.emojis.error} **Anti-Spam is already enabled!**` });
                return;
            }
            guildData.messageFilters.spam = true;
            await database.insertGuild(interaction.guild.id, guildData);
            await interaction.editReply({ content: `${config.emojis.success} **Anti-Spam filter has been Enabled.**` });
        } else if (sub === 'disable') {
            if (!guildData.messageFilters.spam) {
                await interaction.editReply({ content: `${config.emojis.error} **Anti-Spam is already disabled!**` });
                return;
            }
            guildData.messageFilters.spam = false;
            await database.insertGuild(interaction.guild.id, guildData);
            await interaction.editReply({ content: `${config.emojis.success} **Anti-Spam filter has been DISABLED.**` });
        } else if (sub === 'status') {
            const statusEmoji = guildData.messageFilters.spam ? config.emojis.success : config.emojis.error;
            const statusText = guildData.messageFilters.spam ? "Enabled" : "Disabled";

            let description = `**Anti-Spam System ${statusText}.**\n\n**Active Protections:**\n> ${statusEmoji} Anti-Spam`;

            if (!guildData.messageFilters.spam) {
                description += `\n\n**System is currently disabled.**\nUse \`${config.prefix}antispam enable\` to activate security and protect your server! <:6581lockkey:1461100873479487559>`;
            }

            const embed = new EmbedBuilder()
                .setColor(config.colors.primary)
                .setDescription(`**${config.emojis.automod} Anti-Spam Panel**\n\n${description}`)
                .setThumbnail(interaction.client.user?.displayAvatarURL() || null)
                .setFooter({ text: `Requested by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });

            await interaction.editReply({ embeds: [embed] });
        } else {
            // Subcommand not found (likely prefix command empty call)
            const embed = new EmbedBuilder()
                .setColor(config.colors.primary)
                .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
                .setDescription(
                    '`?antispam enable`\n' +
                    '`?antispam disable`\n' +
                    '`?antispam status`'
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
