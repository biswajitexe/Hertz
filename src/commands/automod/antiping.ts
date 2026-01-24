import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { Database } from "../../database";
import * as config from "../../config";

export const command = new SlashCommandBuilder()
    .setName('antiping')
    .setDescription('Configure the Anti-Ping (Mass Mention) system.')
    .addSubcommand(subcommand => subcommand
        .setName('enable')
        .setDescription('Enable the mass mention filter.')
    )
    .addSubcommand(subcommand => subcommand
        .setName('disable')
        .setDescription('Disable the mass mention filter.')
    )
    .addSubcommand(subcommand => subcommand
        .setName('status')
        .setDescription('Check the current status of the anti-ping filter.')
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
        await interaction.reply({ content: `${config.emojis.error} **Only the Server Owner, Trustable Admins, or Bot Owner can manage anti-ping settings.**`, ephemeral: true });
        return;
    }

    const sub = interaction.options.getSubcommand();
    await interaction.deferReply();

    try {
        if (sub === 'enable') {
            if (guildData.messageFilters.massMention) {
                await interaction.editReply({ content: `${config.emojis.error} **Anti-Ping is already enabled!**` });
                return;
            }
            guildData.messageFilters.massMention = true;
            await database.insertGuild(interaction.guild.id, guildData);
            await interaction.editReply({ content: `${config.emojis.success} **Anti-Ping (Mass Mention) filter has been Enabled.**` });
        } else if (sub === 'disable') {
            if (!guildData.messageFilters.massMention) {
                await interaction.editReply({ content: `${config.emojis.error} **Anti-Ping is already disabled!**` });
                return;
            }
            guildData.messageFilters.massMention = false;
            await database.insertGuild(interaction.guild.id, guildData);
            await interaction.editReply({ content: `${config.emojis.success} **Anti-Ping (Mass Mention) filter has been DISABLED.**` });
        } else if (sub === 'status') {
            const statusEmoji = guildData.messageFilters.massMention ? config.emojis.success : config.emojis.error;
            const statusText = guildData.messageFilters.massMention ? "Enabled" : "Disabled";

            let description = `**Anti-Ping System ${statusText}.**\n\n**Active Protections:**\n> ${statusEmoji} Anti-Mass Mention (Limit: > 7)`;

            if (!guildData.messageFilters.massMention) {
                description += `\n\n**System is currently disabled.**\nUse \`${config.prefix}antiping enable\` to activate security and protect your server! <:6581lockkey:1461100873479487559>`;
            }

            const embed = new EmbedBuilder()
                .setColor(config.colors.primary)
                .setDescription(`**${config.emojis.automod} Anti-Ping Panel**\n\n${description}`)
                .setThumbnail(interaction.client.user?.displayAvatarURL() || null)
                .setFooter({ text: `Requested by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });

            await interaction.editReply({ embeds: [embed] });
        } else {
            const embed = new EmbedBuilder()
                .setColor(config.colors.primary)
                .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
                .setDescription(
                    '`?antiping enable`\n' +
                    '`?antiping disable`\n' +
                    '`?antiping status`'
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
