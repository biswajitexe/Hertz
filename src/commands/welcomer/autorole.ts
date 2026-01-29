
import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits, Role, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } from "discord.js";
import { Database } from "../../database";
import * as config from "../../config";

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
        return interaction.reply({ content: `${config.emojis.error} You do not have permission to manage roles.`, ephemeral: true });
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
        const embed = new EmbedBuilder()
            .setColor(config.colors.primary)
            .setThumbnail(interaction.client.user.displayAvatarURL())
            .setDescription(`<:rolemanager58:1464579329974603861> **Autorole Commands**\n\n` +
                `\`?autorole humans <add | remove> <role>\`\n` +
                `\`?autorole bots <add | remove> <role>\`\n` +
                `\`?autorole show\`\n` +
                `\`?autorole reset\``
            )
            .setFooter({ text: `Requested by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });

        return interaction.reply({ embeds: [embed] });
    }

    if (subcommand === 'show') {
        const getEmbed = async (type: 'humans' | 'bots') => {
            const embed = new EmbedBuilder()
                .setColor(config.colors.primary)
                .setFooter({ text: `Requested by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });

            if (type === 'humans') {
                const list = guildData.autoroles.map((id, i) => `\`「${i + 1}」\` <@&${id}>`).join('\n') || "None";
                embed.setAuthor({ name: 'Autorole Humans', iconURL: 'https://cdn.discordapp.com/emojis/1459604921451020472.png' });
                embed.setDescription(list);
            } else {
                const list = guildData.autorolesBots.map((id, i) => `\`「${i + 1}」\` <@&${id}>`).join('\n') || "None";
                embed.setAuthor({ name: 'Autorole Bots', iconURL: 'https://cdn.discordapp.com/emojis/1464605545293025395.png' });
                embed.setDescription(list);
            }
            return embed;
        };

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder().setCustomId('ar_show_humans').setLabel('Humans').setStyle(ButtonStyle.Secondary).setEmoji('<:online:1458160864032194591>'),
            new ButtonBuilder().setCustomId('ar_show_bots').setLabel('Bots').setStyle(ButtonStyle.Secondary).setEmoji('<:iconbot:1458160287290102008>')
        );

        const reply = await interaction.reply({ embeds: [await getEmbed('humans')], components: [row] });
        const collector = reply.createMessageComponentCollector({ componentType: ComponentType.Button, time: 60000 });

        collector.on('collect', async (i) => {
            if (i.user.id !== interaction.user.id) {
                await i.reply({ content: `${config.emojis.error} **Only the requester can use these buttons.**`, ephemeral: true });
                return;
            }

            if (i.customId === 'ar_show_humans') await i.update({ embeds: [await getEmbed('humans')] });
            else if (i.customId === 'ar_show_bots') await i.update({ embeds: [await getEmbed('bots')] });
        });

        collector.on('end', () => {
            const disabledRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder().setCustomId('ar_show_humans').setLabel('Humans').setStyle(ButtonStyle.Secondary).setDisabled(true).setEmoji('<:online:1458160864032194591>'),
                new ButtonBuilder().setCustomId('ar_show_bots').setLabel('Bots').setStyle(ButtonStyle.Secondary).setDisabled(true).setEmoji('<:iconbot:1458160287290102008>')
            );
            reply.edit({ components: [disabledRow] }).catch(() => { });
        });
        return;
    }

    if (subcommand === 'reset') {
        if (guildData.autoroles.length === 0 && guildData.autorolesBots.length === 0) {
            return interaction.reply({ content: `${config.emojis.warning} Autorole configuration is already empty.`, ephemeral: true });
        }

        guildData.autoroles = [];
        guildData.autorolesBots = [];
        await database.insertGuild(guildId, guildData);
        return interaction.reply(`${config.emojis.success} All autoroles (humans and bots) have been cleared.`);
    }

    // Logic for Humans/Bots add/remove
    const targetArray = subcommandGroup === 'bots' ? guildData.autorolesBots : guildData.autoroles;
    const typeName = subcommandGroup === 'bots' ? 'Bots' : 'Humans';
    const role = interaction.options.getRole('role', false) as Role;

    if (!role) {
        return interaction.reply({ content: `${config.emojis.error} Role not found. Please provide a valid Role or Role ID.`, ephemeral: true });
    }

    if (subcommand === 'add') {
        // Validation
        if (role.managed) return interaction.reply({ content: `${config.emojis.error} Cannot add managed roles.`, ephemeral: true });
        if (role.name === '@everyone' || role.id === interaction.guildId) return interaction.reply({ content: `${config.emojis.error} Cannot add everyone role.`, ephemeral: true });

        const botMember = await interaction.guild.members.fetchMe();
        if (role.position >= botMember.roles.highest.position) return interaction.reply({ content: `${config.emojis.error} I cannot assign this role (it is higher than my highest role).`, ephemeral: true });

        if (interaction.user.id !== interaction.guild.ownerId && interaction.user.id !== process.env.OWNER_ID) {
            const member = interaction.member as any;
            if (role.position >= member.roles.highest.position) return interaction.reply({ content: `${config.emojis.error} You cannot assign a role higher or equal to your own.`, ephemeral: true });
        }

        if (targetArray.includes(role.id)) return interaction.reply({ content: `${config.emojis.error} Role is already an autorole for ${typeName}.`, ephemeral: true });
        if (targetArray.length >= 10) return interaction.reply({ content: `${config.emojis.error} Max 10 autoroles allowed per category.`, ephemeral: true });

        targetArray.push(role.id);
        await database.insertGuild(guildId, guildData);
        return interaction.reply(`${config.emojis.success} Added ${role} to **${typeName}** autoroles.`);
    }

    if (subcommand === 'remove') {
        if (!targetArray.includes(role.id)) return interaction.reply({ content: `${config.emojis.error} That role is not in the **${typeName}** autorole list.`, ephemeral: true });

        const index = targetArray.indexOf(role.id);
        targetArray.splice(index, 1);
        await database.insertGuild(guildId, guildData);
        return interaction.reply(`${config.emojis.success} Removed ${role} from **${typeName}** autoroles.`);
    }
}
