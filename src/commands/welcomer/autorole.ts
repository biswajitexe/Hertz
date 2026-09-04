import { ChatInputCommandInteraction, SlashCommandBuilder, PermissionFlagsBits, Role, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } from "discord.js";
import { Database } from "../../database";
import * as config from "../../config";
import { V2Embed, createErrorV2, createSuccessV2 } from "../../utilities/componentV2";

export const command = new SlashCommandBuilder()
    .setName('autorole')
    .setDescription('Manage automatic roles for new members')
    .addSubcommandGroup(group =>
        group.setName('humans')
            .setDescription('Manage autoroles for humans')
            .addSubcommand(sub =>
                sub.setName('add')
                    .setDescription('Add a role for humans')
                    .addRoleOption(opt => opt.setName('role').setDescription('The role to add').setRequired(true))
            )
            .addSubcommand(sub =>
                sub.setName('remove')
                    .setDescription('Remove a role for humans')
                    .addRoleOption(opt => opt.setName('role').setDescription('The role to remove').setRequired(true))
            )
    )
    .addSubcommandGroup(group =>
        group.setName('bots')
            .setDescription('Manage autoroles for bots')
            .addSubcommand(sub =>
                sub.setName('add')
                    .setDescription('Add a role for bots')
                    .addRoleOption(opt => opt.setName('role').setDescription('The role to add').setRequired(true))
            )
            .addSubcommand(sub =>
                sub.setName('remove')
                    .setDescription('Remove a role for bots')
                    .addRoleOption(opt => opt.setName('role').setDescription('The role to remove').setRequired(true))
            )
    )
    .addSubcommand(sub =>
        sub.setName('show')
            .setDescription('Show all configured autoroles')
    )
    .addSubcommand(sub =>
        sub.setName('reset')
            .setDescription('Clear all autoroles')
    );

export async function run(interaction: ChatInputCommandInteraction, database: Database) {
    if (!interaction.guild) return;

    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageRoles) && interaction.user.id !== process.env.OWNER_ID) {
        return interaction.reply(createErrorV2('You do not have permission to manage roles.').toPayload({ ephemeral: true }));
    }

    const guildId = interaction.guildId!;
    let guildData = await database.retrieveGuild(guildId);
    if (!guildData) {
        await database.defaultGuild(interaction.guild);
        guildData = await database.retrieveGuild(guildId);
        if (!guildData) return;
    }

    if (!guildData.autoroles) guildData.autoroles = [];
    if (!guildData.autorolesBots) guildData.autorolesBots = [];

    const subcommandGroup = interaction.options.getSubcommandGroup(false);
    const subcommand = interaction.options.getSubcommand(false);

    if (!subcommand || subcommand === 'help') {
        const embed = new V2Embed()
            .setColor(config.colors.default)
            .setThumbnail(interaction.client.user.displayAvatarURL())
            .setTitle(`${config.emojis.welcomer} Autorole Commands`)
            .setDescription(`${config.emojis.role} **Configure Auto-Roles for new members**\n\n` +
                `\`?autorole humans <add | remove> <role>\`\n` +
                `\`?autorole bots <add | remove> <role>\`\n` +
                `\`?autorole show\`\n` +
                `\`?autorole reset\``
            )
            .setFooter(`Requested by ${interaction.user.username} | Powered by Hertz`, interaction.user.displayAvatarURL());

        return interaction.reply(embed.toPayload());
    }

    if (subcommand === 'show') {
        let activeType: 'humans' | 'bots' = 'humans';
        const getEmbed = (type: 'humans' | 'bots') => {
            const embed = new V2Embed()
                .setColor(config.colors.default)
                .setFooter(`Requested by ${interaction.user.username} | Powered by Hertz`, interaction.user.displayAvatarURL());

            if (type === 'humans') {
                const list = guildData.autoroles.map((id, i) => `\`「${i + 1}」\` <@&${id}>`).join('\n') || "None";
                embed.setAuthor('Autorole Humans', interaction.client.user.displayAvatarURL());
                embed.setDescription(list);
            } else {
                const list = guildData.autorolesBots.map((id, i) => `\`「${i + 1}」\` <@&${id}>`).join('\n') || "None";
                embed.setAuthor('Autorole Bots', interaction.client.user.displayAvatarURL());
                embed.setDescription(list);
            }
            return embed;
        };

        const getRow = (disabled = false) => new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder().setCustomId('ar_show_humans').setLabel('Humans').setStyle(ButtonStyle.Secondary).setEmoji(config.emojis.human).setDisabled(disabled),
            new ButtonBuilder().setCustomId('ar_show_bots').setLabel('Bots').setStyle(ButtonStyle.Secondary).setEmoji(config.emojis.bot).setDisabled(disabled)
        );

        const reply = await interaction.reply(getEmbed('humans').toPayload({ extraComponents: [getRow()] }));
        const collector = reply.createMessageComponentCollector({ componentType: ComponentType.Button, time: 60000 });

        collector.on('collect', async (i) => {
            if (i.user.id !== interaction.user.id) {
                await i.reply(createErrorV2('Only the requester can use these buttons.').toPayload({ ephemeral: true }));
                return;
            }

            if (i.customId === 'ar_show_humans') {
                activeType = 'humans';
                await i.update(getEmbed('humans').toPayload({ extraComponents: [getRow()] }));
            } else if (i.customId === 'ar_show_bots') {
                activeType = 'bots';
                await i.update(getEmbed('bots').toPayload({ extraComponents: [getRow()] }));
            }
        });

        collector.on('end', () => {
            reply.edit(getEmbed(activeType).toPayload({ extraComponents: [getRow(true)] })).catch(() => { });
        });
        return;
    }

    if (subcommand === 'reset') {
        if (guildData.autoroles.length === 0 && guildData.autorolesBots.length === 0) {
            return interaction.reply(createErrorV2('Autorole configuration is already empty.').toPayload({ ephemeral: true }));
        }

        guildData.autoroles = [];
        guildData.autorolesBots = [];
        await database.insertGuild(guildId, guildData);
        return interaction.reply(createSuccessV2('All autoroles (humans and bots) have been cleared.').toPayload());
    }

    // Logic for Humans/Bots add/remove
    const targetArray = subcommandGroup === 'bots' ? guildData.autorolesBots : guildData.autoroles;
    const typeName = subcommandGroup === 'bots' ? 'Bots' : 'Humans';
    const role = interaction.options.getRole('role', false) as Role;

    if (!role) {
        return interaction.reply(createErrorV2('Role not found. Please provide a valid Role or Role ID.').toPayload({ ephemeral: true }));
    }

    if (subcommand === 'add') {
        // Validation
        if (role.managed) return interaction.reply(createErrorV2('Cannot add managed roles.').toPayload({ ephemeral: true }));
        if (role.name === '@everyone' || role.id === interaction.guildId) return interaction.reply(createErrorV2('Cannot add everyone role.').toPayload({ ephemeral: true }));

        const botMember = await interaction.guild.members.fetchMe();
        if (role.position >= botMember.roles.highest.position) return interaction.reply(createErrorV2('I cannot assign this role (it is higher than my highest role).').toPayload({ ephemeral: true }));

        if (interaction.user.id !== interaction.guild.ownerId && interaction.user.id !== process.env.OWNER_ID) {
            const member = interaction.member as any;
            if (role.position >= member.roles.highest.position) return interaction.reply(createErrorV2('You cannot assign a role higher or equal to your own.').toPayload({ ephemeral: true }));
        }

        if (targetArray.includes(role.id)) return interaction.reply(createErrorV2(`Role is already an autorole for ${typeName}.`).toPayload({ ephemeral: true }));
        if (targetArray.length >= 10) return interaction.reply(createErrorV2('Max 10 autoroles allowed per category.').toPayload({ ephemeral: true }));

        targetArray.push(role.id);
        await database.insertGuild(guildId, guildData);
        return interaction.reply(createSuccessV2(`Added ${role} to **${typeName}** autoroles.`).toPayload());
    }

    if (subcommand === 'remove') {
        if (!targetArray.includes(role.id)) return interaction.reply(createErrorV2(`That role is not in the **${typeName}** autorole list.`).toPayload({ ephemeral: true }));

        const index = targetArray.indexOf(role.id);
        targetArray.splice(index, 1);
        await database.insertGuild(guildId, guildData);
        return interaction.reply(createSuccessV2(`Removed ${role} from **${typeName}** autoroles.`).toPayload());
    }
}
