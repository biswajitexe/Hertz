import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Database } from "../../database";
import * as config from "../../config";
import { V2Embed, createErrorV2, createSuccessV2 } from "../../utilities/componentV2";

export const command = new SlashCommandBuilder()
    .setName('extraadmin')
    .setDescription('Manage users with Extra Admin privileges.')
    .addSubcommand(sub => sub
        .setName('add')
        .setDescription('Add a user as an Extra Admin.')
        .addUserOption(opt => opt.setName('user').setDescription('The user to add').setRequired(true))
    )
    .addSubcommand(sub => sub
        .setName('remove')
        .setDescription('Remove a user from Extra Admins.')
        .addUserOption(opt => opt.setName('user').setDescription('The user to remove').setRequired(true))
    )
    .addSubcommand(sub => sub
        .setName('show')
        .setDescription('Show all Extra Admins.')
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

    // Permission Check: Owner OR Extra Owner
    const isOwner = interaction.user.id === interaction.guild.ownerId;
    const isExtraOwner = guildData.extraOwners.includes(interaction.user.id);

    if (!isOwner && !isExtraOwner) {
        await interaction.reply(createErrorV2('Only the Server Owner or Extra Owners can manage Extra Admins.').toPayload({ ephemeral: true }));
        return;
    }

    const sub = interaction.options.getSubcommand();

    if (sub === 'add') {
        const user = interaction.options.getUser('user');

        if (!user) {
            await interaction.reply(createErrorV2(`Please specify a user to add.\nUsage: \`${config.prefix}extraadmin add <@user>\``).toPayload({ ephemeral: true }));
            return;
        }

        if (guildData.extraAdmins.includes(user.id)) {
            await interaction.reply(createErrorV2(`<@${user.id}> is already an Extra Admin.`).toPayload({ ephemeral: true }));
            return;
        }

        guildData.extraAdmins.push(user.id);
        await database.insertGuild(interaction.guild.id, guildData);
        await interaction.reply(createSuccessV2(`Successfully added <@${user.id}> as an Extra Admin.`).toPayload());

    } else if (sub === 'remove') {
        const user = interaction.options.getUser('user');

        if (!user) {
            await interaction.reply(createErrorV2(`Please specify a user to remove.\nUsage: \`${config.prefix}extraadmin remove <@user>\``).toPayload({ ephemeral: true }));
            return;
        }

        if (!guildData.extraAdmins.includes(user.id)) {
            await interaction.reply(createErrorV2(`<@${user.id}> is not an Extra Admin.`).toPayload({ ephemeral: true }));
            return;
        }

        guildData.extraAdmins = guildData.extraAdmins.filter(id => id !== user.id);
        await database.insertGuild(interaction.guild.id, guildData);
        await interaction.reply(createSuccessV2(`Successfully removed <@${user.id}> from Extra Admins.`).toPayload());

    } else if (sub === 'show') {
        const users = guildData.extraAdmins;

        const description = users.length > 0
            ? (await Promise.all(users.map(async (id, i) => {
                const user = await interaction.client.users.fetch(id).catch(() => null);
                return `\`「${i + 1}」\` | \`${user ? user.username : 'Unknown'}「${id}」\``;
            }))).join('\n')
            : "**No Extra Admins set.**";

        const card = new V2Embed()
            .setColor(config.colors.default)
            .setTitle(`${config.emojis.roles} Extra Admins`)
            .setDescription(description)
            .setFooter(`Requested by ${interaction.user.username}! | Powered by Hertz`);

        await interaction.reply(card.toPayload());
    } else {
        // Help Menu
        const card = new V2Embed()
            .setColor(config.colors.default)
            .setTitle(`${config.emojis.roles} Extra Admin Commands`)
            .setDescription(
                `> \`${config.prefix}extraadmin add <user>\`\n` +
                `> \`${config.prefix}extraadmin remove <user>\`\n` +
                `> \`${config.prefix}extraadmin show\``
            )
            .setFooter(`Requested by ${interaction.user.username}! | Powered by Hertz`);

        await interaction.reply(card.toPayload());
    }
}
