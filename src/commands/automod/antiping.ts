import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Database } from "../../database";
import * as config from "../../config";
import { V2Embed, createErrorV2, createSuccessV2 } from "../../utilities/componentV2";

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
        await interaction.reply(createErrorV2('Only the Server Owner, Trustable Admins, or Bot Owner can manage anti-ping settings.').toPayload({ ephemeral: true }));
        return;
    }

    const sub = interaction.options.getSubcommand();
    await interaction.deferReply();

    try {
        if (sub === 'enable') {
            if (guildData.messageFilters.massMention) {
                await interaction.editReply(createErrorV2('Anti-Ping is already enabled!').toPayload());
                return;
            }
            guildData.messageFilters.massMention = true;
            await database.insertGuild(interaction.guild.id, guildData);
            await interaction.editReply(createSuccessV2('Anti-Ping (Mass Mention) filter has been Enabled.').toPayload());
        } else if (sub === 'disable') {
            if (!guildData.messageFilters.massMention) {
                await interaction.editReply(createErrorV2('Anti-Ping is already disabled!').toPayload());
                return;
            }
            guildData.messageFilters.massMention = false;
            await database.insertGuild(interaction.guild.id, guildData);
            await interaction.editReply(createSuccessV2('Anti-Ping (Mass Mention) filter has been DISABLED.').toPayload());
        } else if (sub === 'status') {
            const statusEmoji = guildData.messageFilters.massMention ? config.emojis.switch_on : config.emojis.switch_off;
            const statusText = guildData.messageFilters.massMention ? "Enabled" : "Disabled";

            let description = `> Modular, high-performance automated moderation filter.\n\n` +
                `• **Status:** ${statusText}\n` +
                `• **Filter:** ${statusEmoji} Anti-Mass Mention (> 7 mentions)`;

            if (!guildData.messageFilters.massMention) {
                description += `\n\n> ${config.emojis.lock} Use \`${config.prefix}antiping enable\` to activate protection.`;
            }

            const embed = new V2Embed()
                .setColor(config.colors.default)
                .setTitle(`${config.emojis.automod} Anti-Ping Panel`)
                .setDescription(description)
                .setFooter(`Requested by ${interaction.user.username}! | Powered by Hertz`);

            await interaction.editReply(embed.toPayload());
        } else {
            const embed = new V2Embed()
                .setColor(config.colors.default)
                .setTitle(`${config.emojis.automod} Anti-Ping Commands`)
                .setDescription(
                    `> \`${config.prefix}antiping enable\`\n` +
                    `> \`${config.prefix}antiping disable\`\n` +
                    `> \`${config.prefix}antiping status\``
                )
                .setFooter(`Requested by ${interaction.user.username}! | Powered by Hertz`);
            await interaction.editReply(embed.toPayload());
        }
    } catch (error) {
        console.error(error);
        await interaction.editReply(createErrorV2('Failed to update settings.').toPayload());
    }
}
