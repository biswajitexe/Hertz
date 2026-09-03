import { ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { Database } from "../../database";
import { canModerate } from "../../utilities/permission";
import * as config from "../../config";
import { logAction } from "../../utilities/modLogger";
import { V2Embed, createErrorV2 } from "../../utilities/componentV2";

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
        return interaction.reply(createErrorV2("You do not have permission to ban members.").toPayload({ ephemeral: true }));
    }

    if (!user) {
        return interaction.reply(createErrorV2("User/ID not found.").toPayload({ ephemeral: true }));
    }

    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
    if (member) {
        if (user.id === interaction.user.id) {
            await interaction.reply(createErrorV2("**You cannot fuckban yourself.**").toPayload({ ephemeral: true }));
            return;
        }
        if (user.id === interaction.client.user.id) {
            await interaction.reply(createErrorV2("**You cannot fuckban me.**").toPayload({ ephemeral: true }));
            return;
        }
        if (user.id === interaction.guild.ownerId) {
            await interaction.reply(createErrorV2("**You cannot fuckban the server owner.**").toPayload({ ephemeral: true }));
            return;
        }
        if (!member.bannable) {
            await interaction.reply(createErrorV2("**I cannot fuckban this user (My role is too low).**").toPayload({ ephemeral: true }));
            return;
        }

        if (!canModerate(interaction.member, member, PermissionFlagsBits.BanMembers)) {
            await interaction.reply(createErrorV2("**You cannot moderate this user.**").toPayload({ ephemeral: true }));
            return;
        }
    }

    await interaction.deferReply();

    // Aggressive DM
    try {
        const dm = new V2Embed()
            .setColor(0x000000)
            .setTitle(`GTFO from ${interaction.guild.name}`)
            .setDescription(`**You have been FUCK BANNED!**\nDon't ever come back.\n\n**Reason:** ${reason}`)
            .setImage('https://media.tenor.com/x8v1k5Ki3aEAAAAC/ban-hammer-discord.gif');
        await user.send(dm.toPayload()).catch(() => {});
    } catch (e) { }

    try {
        await interaction.guild.members.ban(user.id, { reason: `[FUCK BAN] ${reason}`, deleteMessageSeconds: 7 * 24 * 60 * 60 });

        await logAction(interaction.guild, user, interaction.user, 'BAN', `(FUCK BAN) ${reason}`, database);

        const embed = new V2Embed()
            .setColor(config.colors.error)
            .setTitle(`${config.emojis.error} BEGONE!`)
            .setDescription(`**${user.tag}** has been obliterated from the server.`)
            .setImage('https://media.tenor.com/x8v1k5Ki3aEAAAAC/ban-hammer-discord.gif');

        if (reason !== "No reason provided (Just GTFO)") {
            embed.addFields({ name: 'Reason', value: reason, inline: false });
        }

        await interaction.editReply(embed.toPayload());

    } catch (error) {
        console.error(error);
        await interaction.editReply(createErrorV2("**Failed to execute fuckban.**").toPayload());
    }
}
