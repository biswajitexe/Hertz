
import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { Database } from "../../database";
import * as config from "../../config";

export const command = new SlashCommandBuilder()
    .setName('bio')
    .setDescription('Customize your profile')
    .addSubcommand(sub => sub
        .setName('set')
        .setDescription('Set your profile bio')
        .addStringOption(opt => opt.setName('text').setDescription('Your new bio (Max 200 chars)').setRequired(true))
    )
    .addSubcommand(sub => sub
        .setName('color')
        .setDescription('Set your profile embed color')
        .addStringOption(opt => opt.setName('hex').setDescription('Hex Color Code (e.g. #FF0000)').setRequired(true))
    );

export async function run(interaction: ChatInputCommandInteraction, database: Database) {
    if (!interaction.inCachedGuild()) return;

    const sub = interaction.options.getSubcommand();
    const userProfile = await database.getUser(interaction.user.id);

    const embedStyle = (title: string, description: string, color: number = config.colors.primary) => {
        return new EmbedBuilder()
            .setColor(color)
            .setDescription(`**<:32725firehonkaistarrail:1465068073143894106> ${title}**\n\n${description}`)
            .setThumbnail(interaction.user.displayAvatarURL())
            .setFooter({ text: `Requested by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });
    };

    if (sub === 'set') {
        const text = interaction.options.getString('text', true);
        if (text.length > 200) {
            return interaction.reply({ embeds: [embedStyle('Bio Error', '> Bio cannot exceed 200 characters.', config.colors.error)], ephemeral: true });
        }

        userProfile.bio = text;
        await database.updateUser(userProfile);
        return interaction.reply({ embeds: [embedStyle('Bio Updated', `> Your bio has been updated!`)] });
    }

    if (sub === 'color') {
        const hex = interaction.options.getString('hex', true).replace('#', '');
        const colorInt = parseInt(hex, 16);

        if (isNaN(colorInt) || colorInt < 0 || colorInt > 0xFFFFFF) {
            return interaction.reply({ embeds: [embedStyle('Color Error', '> Invalid Hex Code. Try format like `FF0000`.', config.colors.error)], ephemeral: true });
        }

        userProfile.color = colorInt;
        await database.updateUser(userProfile);
        return interaction.reply({ embeds: [embedStyle('Color Updated', `> Your profile color has been updated!`, colorInt)] });
    }
}
