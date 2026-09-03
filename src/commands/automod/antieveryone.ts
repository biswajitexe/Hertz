import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Database } from "../../database";
import * as config from "../../config";
import { V2Embed, createErrorV2, createSuccessV2 } from "../../utilities/componentV2";

export const command = new SlashCommandBuilder()
    .setName('antieveryone')
    .setDescription('Configure the anti-everyone/here system.')
    .addSubcommand(subcommand => subcommand
        .setName('enable')
        .setDescription('Enable the anti-everyone filter.')
    )
    .addSubcommand(subcommand => subcommand
        .setName('disable')
        .setDescription('Disable the anti-everyone filter.')
    )
    .addSubcommand(subcommand => subcommand
        .setName('status')
        .setDescription('Check the current status of the anti-everyone filter.')
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
        await interaction.reply(createErrorV2('Only the Server Owner, Trustable Admins, or Bot Owner can manage anti-everyone settings.').toPayload({ ephemeral: true }));
        return;
    }

    const sub = interaction.options.getSubcommand();
    await interaction.deferReply();

    try {
        if (sub === 'enable') {
            if (guildData.messageFilters.antiEveryone) {
                await interaction.editReply(createErrorV2('Anti-Everyone is already enabled!').toPayload());
                return;
            }
            guildData.messageFilters.antiEveryone = true;
            await database.insertGuild(interaction.guild.id, guildData);
            await interaction.editReply(createSuccessV2('Anti-Everyone filter has been Enabled.').toPayload());
        } else if (sub === 'disable') {
            if (!guildData.messageFilters.antiEveryone) {
                await interaction.editReply(createErrorV2('Anti-Everyone is already disabled!').toPayload());
                return;
            }
            guildData.messageFilters.antiEveryone = false;
            await database.insertGuild(interaction.guild.id, guildData);
            await interaction.editReply(createSuccessV2('Anti-Everyone filter has been DISABLED.').toPayload());
        } else if (sub === 'status') {
            const statusEmoji = guildData.messageFilters.antiEveryone ? config.emojis.success : config.emojis.error;
            const statusText = guildData.messageFilters.antiEveryone ? "Enabled" : "Disabled";

            let description = `**Anti-Everyone System ${statusText}.**\n\n**Active Protections:**\n> ${statusEmoji} Anti-Everyone/Here`;

            if (!guildData.messageFilters.antiEveryone) {
                description += `\n\n**System is currently disabled.**\nUse \`${config.prefix}antieveryone enable\` to activate security and protect your server! <:6581lockkey:1461100873479487559>`;
            }

            const embed = new V2Embed()
                .setColor(config.colors.primary)
                .setTitle(`${config.emojis.automod} Anti-Everyone Panel`)
                .setDescription(description)
                .setThumbnail(interaction.client.user?.displayAvatarURL() || null)
                .setFooter(`Requested by ${interaction.user.username}`, interaction.user.displayAvatarURL());

            await interaction.editReply(embed.toPayload());
        } else {
            // Fallback for prefix command help
            const embed = new V2Embed()
                .setColor(config.colors.primary)
                .setAuthor(interaction.user.tag, interaction.user.displayAvatarURL())
                .setTitle('Anti-Everyone Commands')
                .setDescription(
                    '`?antieveryone enable`\n' +
                    '`?antieveryone disable`\n' +
                    '`?antieveryone status`'
                )
                .setThumbnail(interaction.client.user?.displayAvatarURL() || null)
                .setFooter('Hertz • Automated Security', interaction.client.user?.displayAvatarURL() || undefined);
            await interaction.editReply(embed.toPayload());
        }
    } catch (error) {
        console.error(error);
        await interaction.editReply(createErrorV2('Failed to update settings.').toPayload());
    }
}
