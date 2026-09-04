import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Database } from "../../database";
import * as config from "../../config";
import { V2Embed, createErrorV2, createSuccessV2 } from "../../utilities/componentV2";

export const command = new SlashCommandBuilder()
    .setName('extraowner')
    .setDescription('Manage users with Extra Owner privileges.')
    .addSubcommand(sub => sub
        .setName('add')
        .setDescription('Add a user as an Extra Owner.')
        .addUserOption(opt => opt.setName('user').setDescription('The user to add').setRequired(true))
    )
    .addSubcommand(sub => sub
        .setName('remove')
        .setDescription('Remove a user from Extra Owners.')
        .addUserOption(opt => opt.setName('user').setDescription('The user to remove').setRequired(true))
    )
    .addSubcommand(sub => sub
        .setName('show')
        .setDescription('Show all Extra Owners.')
    );

export async function run(interaction: ChatInputCommandInteraction, database: Database) {
    if (!interaction.inCachedGuild()) return;

    // Strict Permission: Only Real Guild Owner
    if (interaction.user.id !== interaction.guild.ownerId) {
        await interaction.reply(createErrorV2('Only the Server Owner can manage Extra Owners.').toPayload({ ephemeral: true }));
        return;
    }

    const sub = interaction.options.getSubcommand();
    let guildData = await database.retrieveGuild(interaction.guild.id);
    if (!guildData) {
        await database.defaultGuild(interaction.guild);
        guildData = await database.retrieveGuild(interaction.guild.id);
    }
    if (!guildData) return;

    if (!guildData.extraOwners) guildData.extraOwners = [];

    if (sub === 'add') {
        const user = interaction.options.getUser('user');

        if (!user) {
            await interaction.reply(createErrorV2(`Please specify a user to add.\nUsage: \`${config.prefix}extraowner add <@user>\``).toPayload({ ephemeral: true }));
            return;
        }

        if (guildData.extraOwners.includes(user.id)) {
            await interaction.reply(createErrorV2(`<@${user.id}> is already an Extra Owner.`).toPayload({ ephemeral: true }));
            return;
        }

        guildData.extraOwners.push(user.id);
        await database.insertGuild(interaction.guild.id, guildData);
        await interaction.reply(createSuccessV2(`Successfully added <@${user.id}> as an Extra Owner.`).toPayload());

    } else if (sub === 'remove') {
        const user = interaction.options.getUser('user');

        if (!user) {
            await interaction.reply(createErrorV2(`Please specify a user to remove.\nUsage: \`${config.prefix}extraowner remove <@user>\``).toPayload({ ephemeral: true }));
            return;
        }

        if (!guildData.extraOwners.includes(user.id)) {
            await interaction.reply(createErrorV2(`<@${user.id}> is not an Extra Owner.`).toPayload({ ephemeral: true }));
            return;
        }

        guildData.extraOwners = guildData.extraOwners.filter(id => id !== user.id);
        await database.insertGuild(interaction.guild.id, guildData);
        await interaction.reply(createSuccessV2(`Successfully removed <@${user.id}> from Extra Owners.`).toPayload());

    } else if (sub === 'show') {
        const users = guildData.extraOwners;

        const description = users.length > 0
            ? (await Promise.all(users.map(async (id, i) => {
                const user = await interaction.client.users.fetch(id).catch(() => null);
                return `\`「${i + 1}」\` | \`${user ? user.username : 'Unknown'}「${id}」\``;
            }))).join('\n')
            : "**No Extra Owners set.**";

        const card = new V2Embed()
            .setColor(config.colors.default)
            .setTitle(`${config.emojis.owner} Extra Owners`)
            .setDescription(description)
            .setFooter(`Requested by ${interaction.user.username}! | Powered by Hertz`);

        await interaction.reply(card.toPayload());
    } else {
        // Help Menu
        const card = new V2Embed()
            .setColor(config.colors.default)
            .setTitle(`${config.emojis.owner} Extra Owner Commands`)
            .setDescription(
                `> \`${config.prefix}extraowner add <user>\`\n` +
                `> \`${config.prefix}extraowner remove <user>\`\n` +
                `> \`${config.prefix}extraowner show\``
            )
            .setFooter(`Requested by ${interaction.user.username}! | Powered by Hertz`);

        await interaction.reply(card.toPayload());
    }
}
