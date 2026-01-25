
import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { Database } from "../../database";
import * as config from "../../config";

export const command = new SlashCommandBuilder()
    .setName('rep')
    .setDescription('Give a reputation point to someone')
    .addUserOption(opt => opt.setName('user').setDescription('The user to rep').setRequired(true));

export async function run(interaction: ChatInputCommandInteraction, database: Database) {
    if (!interaction.inCachedGuild()) return;

    const targetUser = interaction.options.getUser('user', true);

    if (targetUser.id === interaction.user.id) {
        return interaction.reply({ content: `${config.emojis.error} You cannot rep yourself!`, ephemeral: true });
    }

    if (targetUser.bot) {
        return interaction.reply({ content: `${config.emojis.error} Bots don't need rep!`, ephemeral: true });
    }

    const giverProfile = await database.getUser(interaction.user.id);
    const receiverProfile = await database.getUser(targetUser.id);

    const now = Date.now();
    const cooldown = 24 * 60 * 60 * 1000; // 24 Hours

    if (now - giverProfile.lastRepDate < cooldown) {
        const remaining = giverProfile.lastRepDate + cooldown;
        return interaction.reply({ content: `${config.emojis.error} You can give rep again <t:${Math.floor(remaining / 1000)}:R>.`, ephemeral: true });
    }

    giverProfile.lastRepDate = now;
    receiverProfile.reps += 1;

    await database.updateUser(giverProfile);
    await database.updateUser(receiverProfile);

    const embed = new EmbedBuilder()
        .setColor(config.colors.success)
        .setDescription(`**<:32725firehonkaistarrail:1465068073143894106> Reputation Given!**\n\n> You gave a reputation point to **${targetUser.username}**!\n> They now have **${receiverProfile.reps}** reps.`)
        .setFooter({ text: `Given by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });

    return interaction.reply({ embeds: [embed] });
}
