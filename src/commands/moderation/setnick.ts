
import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { Database } from "../../database";
import * as config from "../../config";

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

    // Flexible Argument Handling (Swap Check)
    // Scenario: ?setnick NewName @User
    // Parser: target="NewName" (fails to resolve user -> null), nickname="@User"
    // We can check if 'target' raw input was actually the nickname, and 'nickname' raw input was the user.
    if (!targetUser) {
        // Attempt to recover from raw args if provided
        const rawTargetArg = interaction.options.getString('target'); // In hybrid parser, we map to Shim, but let's assume we can access what mapped to 'target' via implicit knowledge or just check 'nickname' slot?
        // Actually, our shim 'getString' wrapper works for ALL options by name if mapped.
        // Check if `nickname` slot contains a User?
        // And `target` slot (which failed as User) might indeed be the nickname string.

        // However, the parser in index.ts stops filling 'target' (Type 6) if it's not a user format? 
        // No, my parser logic for Type 6:
        // val = val.replace(/[<@!&>]/g, '');
        // await fetch(val);
        // optionsMap.set(opt.name, val);  <-- It SETS the raw value (cleaned) string into the map.
        // So `interaction.options.getUser('target')` calls map.get, gets "NewName", looks up cache -> Null.
        // But `interaction.options.getString('target')` (if I used it) would return "NewName".
        // Wait, standard `ChatInputCommandInteraction` doesn't strictly allow getString on a User option type? 
        // In my SHIM (index.ts), `getString` does: `optionsMap.get(name)`. 
        // So YES, I can retrieve the raw string of 'target' using `getString('target')`.

        const rawTargetStr = interaction.options.getString('target');
        const rawNicknameStr = interaction.options.getString('nickname'); // This handles the second arg

        if (rawTargetStr && !targetUser) {
            // Case: ?setnick Name @User
            // rawTargetStr = "Name"
            // rawNicknameStr = "@User" (Cleaned to ID hopefully by logic? No, Type 3 is string, logic doesn't clean Type 3 unless last? Type 3 consumes rest. 
            // Wait, `nickname` is Type 3.
            // `index.ts`: if opt.type === 3 ... val = rest.
            // It does NOT clean Type 3.

            // So rawNicknameStr might be "<@123...>" or "123...".
            // Let's try to resolve rawNicknameStr as a User.
            if (rawNicknameStr) {
                const potentialUserId = rawNicknameStr.replace(/[<@!&>]/g, '');
                const potentialUser = await interaction.guild.members.fetch(potentialUserId).then(m => m.user).catch(() => null);

                if (potentialUser) {
                    // Swap found!
                    targetUser = potentialUser;
                    nickname = rawTargetStr;
                }
            }
        }
    }

    if (!targetUser) {
        const embed = new EmbedBuilder()
            .setColor(config.colors.primary)
            .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
            .setThumbnail(interaction.client.user.displayAvatarURL())
            .setDescription(`\`?setnick <user> <name>\`\n\`?resetnick <user>\``)
            .setFooter({ text: `Xeon • Advanced Moderation`, iconURL: interaction.client.user.displayAvatarURL() });
        return interaction.reply({ embeds: [embed] });
    }

    const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

    if (!member) {
        return interaction.reply({ content: `${config.emojis.error} Member not found.`, ephemeral: true });
    }

    if (!member.manageable) {
        return interaction.reply({ content: `${config.emojis.error} I cannot change this member's nickname (Role hierarchy).`, ephemeral: true });
    }

    try {
        const oldNick = member.nickname || member.user.username;
        await member.setNickname(nickname || null);

        const embed = new EmbedBuilder()
            .setColor(0x57F287)
            .setDescription(`${config.emojis.success} Changed **${targetUser.tag}**'s nickname to **${nickname || "Default"}**.`);

        await interaction.reply({ embeds: [embed] });

    } catch (err) {
        console.error(err);
        return interaction.reply({ content: `${config.emojis.error} Failed to change nickname.`, ephemeral: true });
    }
}
