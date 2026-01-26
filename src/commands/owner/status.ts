
import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder, ActivityType } from "discord.js";
import { Database } from "../../database";
import * as config from "../../config";

export const command = new SlashCommandBuilder()
    .setName('status')
    .setDescription('Manage bot status (Owner Only)')
    .addSubcommand(sub => sub
        .setName('set')
        .setDescription('Set the bot presence')
        .addStringOption(opt => opt.setName('type').setDescription('Activity Type').setRequired(true)
            .addChoices(
                { name: 'Playing', value: 'Playing' },
                { name: 'Watching', value: 'Watching' },
                { name: 'Listening', value: 'Listening' },
                { name: 'Competing', value: 'Competing' },
                { name: 'Streaming', value: 'Streaming' }
            )
        )
        .addStringOption(opt => opt.setName('text').setDescription('Status Text').setRequired(true))
    )
    .addSubcommand(sub => sub
        .setName('maintenance')
        .setDescription('Toggle maintenance mode')
        .addBooleanOption(opt => opt.setName('state').setDescription('Enable or Disable?').setRequired(true))
    );

export async function run(interaction: ChatInputCommandInteraction, database: Database) {
    if (interaction.user.id !== process.env.OWNER_ID) return interaction.reply({ content: `🚫 Unknown command.`, ephemeral: true });

    const sub = interaction.options.getSubcommand();

    const embedStyle = (title: string, description: string, color: number = config.colors.primary) => {
        return new EmbedBuilder()
            .setColor(color)
            .setDescription(`**<:74658vipglow:1465051133704798435> ${title}**\n\n${description}`)
            .setThumbnail(interaction.client.user?.displayAvatarURL() || null)
            .setFooter({ text: `Requested by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });
    };

    if (sub === 'set') {
        const typeStr = interaction.options.getString('type', true);
        const text = interaction.options.getString('text', true);

        if (!typeStr || !text) {
             return interaction.reply({ content: `Usage: \`${config.prefix}status set <type> <text>\`\nTypes: Playing, Watching, Listening, Competing, Streaming`, ephemeral: true });
        }

        let type = ActivityType.Playing;
        if (typeStr === 'Watching') type = ActivityType.Watching;
        if (typeStr === 'Listening') type = ActivityType.Listening;
        if (typeStr === 'Competing') type = ActivityType.Competing;
        if (typeStr === 'Streaming') type = ActivityType.Streaming;

        interaction.client.user.setPresence({
            activities: [{ name: text, type: type }],
            status: 'online'
        });

        return interaction.reply({ embeds: [embedStyle('Status Updated', `> Status updated to **${typeStr} ${text}**.`, config.colors.success)], ephemeral: true });
    }

    if (sub === 'maintenance') {
        const state = interaction.options.getBoolean('state', true);

        let botConfig = await database.getBotConfig();
        botConfig.maintenance = state;
        await database.insertBotConfig(botConfig);

        if (state) {
            interaction.client.user.setPresence({ status: 'dnd', activities: [{ name: 'Maintenance Mode', type: ActivityType.Watching }] });
            return interaction.reply({ embeds: [embedStyle('Maintenance Enabled', `> **Maintenance Mode ENABLED.** Users cannot use commands.`, config.colors.warning)], ephemeral: true });
        } else {
            interaction.client.user.setPresence({ status: 'online', activities: [{ name: 'Ready', type: ActivityType.Playing }] });
            return interaction.reply({ embeds: [embedStyle('Maintenance Disabled', `> **Maintenance Mode DISABLED.** Bot is live.`, config.colors.success)], ephemeral: true });
        }
    }
}
