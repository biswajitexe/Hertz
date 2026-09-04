import { ChatInputCommandInteraction, SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { Database } from "../../database";
import * as config from "../../config";
import { V2Embed, createErrorV2 } from "../../utilities/componentV2";

export const command = new SlashCommandBuilder()
    .setName('setnick')
    .setDescription('Change a member\'s nickname')
    .addUserOption(option =>
        option.setName('target')
            .setDescription('The member to change nickname for')
            .setRequired(false)
    )
    .addStringOption(option =>
        option.setName('nickname')
            .setDescription('The new nickname (leave empty to reset)')
            .setRequired(false)
            .setMaxLength(32)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageNicknames);

export async function run(interaction: ChatInputCommandInteraction, database: Database) {
    if (!interaction.guild) return;

    let targetUser = interaction.options.getUser('target');
    let nickname = interaction.options.getString('nickname');

    if (!targetUser) {
        const rawTargetStr = interaction.options.getString('target');
        const rawNicknameStr = interaction.options.getString('nickname');

        if (rawTargetStr && !targetUser) {
            if (rawNicknameStr) {
                const potentialUserId = rawNicknameStr.replace(/[<@!&>]/g, '');
                const potentialUser = await interaction.guild.members.fetch(potentialUserId).then(m => m.user).catch(() => null);

                if (potentialUser) {
                    targetUser = potentialUser;
                    nickname = rawTargetStr;
                }
            }
        }
    }

    if (!targetUser) {
        const embed = new V2Embed()
            .setColor(config.colors.default)
            .setTitle(`Nickname Management`)
            .setDescription(`> Change or reset member nicknames.\n\n• **Set Nickname:** \`${config.prefix}setnick <user> <name>\`\n• **Reset Nickname:** \`${config.prefix}resetnick <user>\``)
            .setFooter(`Requested by ${interaction.user.username}! | Powered by Hertz`);
        return interaction.reply(embed.toPayload());
    }

    const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

    if (!member) {
        return interaction.reply(createErrorV2("Member not found.").toPayload({ ephemeral: true }));
    }

    if (!member.manageable) {
        return interaction.reply(createErrorV2("I cannot change this member's nickname (Role hierarchy).").toPayload({ ephemeral: true }));
    }

    try {
        await member.setNickname(nickname || null);

        const embed = new V2Embed()
            .setColor(config.colors.default)
            .setTitle(`${config.emojis.correct} Nickname Updated`)
            .setDescription(`> Successfully updated member nickname.\n\n• **User:** ${targetUser.tag} (\`${targetUser.id}\`)\n• **Nickname:** \`${nickname || "Default"}\``)
            .setFooter(`Requested by ${interaction.user.username}! | Powered by Hertz`);

        await interaction.reply(embed.toPayload());

    } catch (err) {
        console.error(err);
        return interaction.reply(createErrorV2("Failed to change nickname.").toPayload({ ephemeral: true }));
    }
}
