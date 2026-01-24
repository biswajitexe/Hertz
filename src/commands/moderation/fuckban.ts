import { ChatInputCommandInteraction, PermissionFlagsBits, GuildMember, SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { Database } from "../../database";
import { canModerate } from "../../utilities/permission";
import * as config from "../../config";
import { logAction } from "../../utilities/modLogger";

export const command = new SlashCommandBuilder()
    .setName('fuckban')
    .setDescription('Aggressively ban a user (Hard Ban).')
    .addUserOption(option => option
        .setName('user')
        .setDescription('The user to fuckban.')
        .setRequired(true)
    )
    .addStringOption(option => option
        .setName('reason')
        .setDescription('Reason for the ban.')
    );

export async function run(interaction: ChatInputCommandInteraction, database: Database) {
    if (!interaction.inCachedGuild()) return;

    let user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || "No reason provided (Just GTFO)";

    // Permission Check
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.BanMembers) && interaction.user.id !== process.env.OWNER_ID) {
        return interaction.reply({ content: `${config.emojis.error} You do not have permission to ban members.`, ephemeral: true });
    }

    // ID Fallback for Prefix Commands (Shim might fail to fetch user if not in cache)
    if (!user) {
        // Try to parse from raw options if possible? 
        // Or assume if interaction.options.getUser failed, we might need to try fetching manually if it's an ID
        // But in slash commands, getUser handles it.
        // In prefix shim, we rely on getUser implementation.
        // Let's assume the user provided valid input.
        return interaction.reply({ content: `${config.emojis.error} User/ID not found.`, ephemeral: true });
    }

    // Check if user is in guild to check permissions (hierarchy)
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
    if (member) {
        // Safety Checks for Member
        if (user.id === interaction.user.id) {
            await interaction.reply({ content: `${config.emojis.error} **You cannot fuckban yourself.**`, ephemeral: true });
            return;
        }
        if (user.id === interaction.client.user.id) {
            await interaction.reply({ content: `${config.emojis.error} **You cannot fuckban me.**`, ephemeral: true });
            return;
        }
        if (user.id === interaction.guild.ownerId) {
            await interaction.reply({ content: `${config.emojis.error} **You cannot fuckban the server owner.**`, ephemeral: true });
            return;
        }
        if (!member.bannable) {
            await interaction.reply({ content: `${config.emojis.error} **I cannot fuckban this user (My role is too low).**`, ephemeral: true });
            return;
        }

        if (!canModerate(interaction.member, member, PermissionFlagsBits.BanMembers)) {
            await interaction.reply({ content: `${config.emojis.error} **You cannot moderate this user.**`, ephemeral: true });
            return;
        }
    }

    await interaction.deferReply();

    // Aggressive DM (Only if member exists or we can DM)
    try {
        const dm = new EmbedBuilder()
            .setColor(0x000000)
            .setTitle(`GTFO from ${interaction.guild.name}`)
            .setDescription(`**You have been FUCK BANNED!**\nDon't ever come back.\n\n**Reason:** ${reason}`)
            .setImage('https://media.tenor.com/x8v1k5Ki3aEAAAAC/ban-hammer-discord.gif');
        await user.send({ embeds: [dm] });
    } catch (e) { }

    try {
        await interaction.guild.members.ban(user.id, { reason: `[FUCK BAN] ${reason}`, deleteMessageSeconds: 7 * 24 * 60 * 60 });

        await logAction(interaction.guild, user, interaction.user, 'BAN', `(FUCK BAN) ${reason}`, database);

        const embed = new EmbedBuilder()
            .setColor(config.colors.error)
            .setTitle(`${config.emojis.error} BEGONE THOT!`)
            .setDescription(`**${user.tag}** has been obliterated from the server.`)
            .setImage('https://media.tenor.com/x8v1k5Ki3aEAAAAC/ban-hammer-discord.gif');

        if (reason !== "No reason provided (Just GTFO)") {
            embed.addFields({ name: 'Reason', value: reason, inline: false });
        }

        await interaction.editReply({ embeds: [embed] });

    } catch (error) {
        console.error(error);
        await interaction.editReply({ content: `${config.emojis.error} **Failed to execute fuckban.**` });
    }
}
