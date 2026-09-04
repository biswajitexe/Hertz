import { ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ComponentType, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, InteractionCollector, Message } from "discord.js";
import { Database } from "../../database";
import * as config from "../../config";
import { V2Embed } from "../../utilities/componentV2";

export const aliases = ['wl'];

export const command = new SlashCommandBuilder()
    .setName('whitelist')
    .setDescription('Manage whitelists for protections.')
    .addSubcommand(sub => sub
        .setName('add')
        .setDescription('Add a user, role, or channel to a whitelist.')
        .addStringOption(opt => opt
            .setName('category')
            .setDescription('The category to whitelist in (Default: All)')
            .setRequired(false)
            .addChoices(
                { name: 'All (Everything)', value: 'all' },
                { name: 'Anti-Link', value: 'links' },
                { name: 'Anti-Invite', value: 'invites' },
                { name: 'Anti-Spam', value: 'spam' }
            )
        )
        .addUserOption(opt => opt.setName('user').setDescription('User to whitelist'))
        .addRoleOption(opt => opt.setName('role').setDescription('Role to whitelist'))
        .addChannelOption(opt => opt.setName('channel').setDescription('Channel to whitelist'))
    )
    .addSubcommand(sub => sub
        .setName('remove')
        .setDescription('Remove a user, role, or channel from a whitelist.')
        .addStringOption(opt => opt
            .setName('category')
            .setDescription('The category to remove from (Default: All)')
            .setRequired(false)
            .addChoices(
                { name: 'All (Everything)', value: 'all' },
                { name: 'Anti-Link', value: 'links' },
                { name: 'Anti-Invite', value: 'invites' },
                { name: 'Anti-Spam', value: 'spam' }
            )
        )
        .addUserOption(opt => opt.setName('user').setDescription('User to remove'))
        .addRoleOption(opt => opt.setName('role').setDescription('Role to remove'))
        .addChannelOption(opt => opt.setName('channel').setDescription('Channel to remove'))
    )
    .addSubcommand(sub => sub
        .setName('show')
        .setDescription('View the current whitelist for a category.')
        .addStringOption(opt => opt
            .setName('category')
            .setDescription('The category to view (Default: All)')
            .setRequired(false)
            .addChoices(
                { name: 'Anti-Link', value: 'links' },
                { name: 'Anti-Invite', value: 'invites' },
                { name: 'Anti-Spam', value: 'spam' }
            )
        )
    )
    .addSubcommand(sub => sub
        .setName('reset')
        .setDescription('Reset whitelist for a category.')
        .addStringOption(opt => opt
            .setName('category')
            .setDescription('The category to reset (Default: All)')
            .setRequired(false)
            .addChoices(
                { name: 'All (Everything)', value: 'all' },
                { name: 'Anti-Link', value: 'links' },
                { name: 'Anti-Invite', value: 'invites' },
                { name: 'Anti-Spam', value: 'spam' }
            )
        )
    );

export async function run(interaction: ChatInputCommandInteraction, database: Database) {
    if (!interaction.guild) return;

    if (!interaction.member || typeof interaction.member.permissions === 'string' || !interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
        await interaction.reply({ content: `${config.emojis.error} ** You do not have permission to manage server whitelist.** `, ephemeral: true });
        return;
    }

    // Prefix Command Fallback logic remains same
    let sub: string | null = null;
    let category: string | null = null;
    try {
        sub = interaction.options.getSubcommand();
        category = interaction.options.getString('category');
    } catch (e) { }

    if (!category) category = 'all';

    const validCategories = ['all', 'links', 'invites', 'spam'];
    if (!sub || !category || !validCategories.includes(category)) {
        // --- Prefix Command Handling ---
        const msg = interaction as unknown as Message;
        if (msg.content) {
            const args = msg.content.trim().split(/ +/);
            const action = args[1]?.toLowerCase();
            const possibleTarget = args[2] || args[1]; // args[2] if 'add/remove', args[1] if shortcut

            if (action === 'show' || action === 'list') {
                try {
                    const guildData = await database.retrieveGuild(interaction.guild.id);
                    if (!guildData) {
                        await interaction.reply({ content: `${config.emojis.error} **Database error.**` });
                        return;
                    }
                    if (!guildData.messageFilters) {
                        guildData.messageFilters = {
                            linksWhitelist: { users: [], roles: [], channels: [] },
                            invitesWhitelist: { users: [], roles: [], channels: [] },
                            spamWhitelist: { users: [], roles: [], channels: [] }
                        } as any;
                    }

                    const l = guildData.messageFilters.linksWhitelist || { users: [], roles: [], channels: [] };
                    const i = guildData.messageFilters.invitesWhitelist || { users: [], roles: [], channels: [] };
                    const s = guildData.messageFilters.spamWhitelist || { users: [], roles: [], channels: [] };

                    const userIds = new Set([...l.users, ...i.users, ...s.users]);
                    const roleIds = new Set([...l.roles, ...i.roles, ...s.roles]);
                    const channelIds = new Set([...l.channels, ...i.channels, ...s.channels]);

                    let currentType: 'users' | 'roles' | 'channels' = 'users';
                    const getEmbed = async (type: 'users' | 'roles' | 'channels') => {
                        const embed = new V2Embed()
                            .setColor(config.colors.primary)
                            .setFooter(`Requested by ${interaction.user.tag}`, interaction.user.displayAvatarURL());

                        if (type === 'users') {
                            embed.setAuthor('whitelist users', 'https://cdn.discordapp.com/emojis/1461641597476274332.png');
                            const ids = Array.from(userIds);
                            const names = await Promise.all(ids.map(async id => {
                                try {
                                    const user = await interaction.client.users.fetch(id);
                                    return user.username;
                                } catch {
                                    return `Unknown (${id})`;
                                }
                            }));
                            const list = names.map((name, i) => `\`「${i + 1}」\` | \`${name}「${ids[i]}」\``).join('\n');
                            embed.setDescription(list.length > 0 ? list.slice(0, 4000) : "**No users whitelisted.**");
                        } else if (type === 'roles') {
                            embed.setAuthor('whitelist roles', 'https://cdn.discordapp.com/emojis/1461641597476274332.png');
                            const list = Array.from(roleIds).map((id, i) => `${i + 1}. <@&${id}>`).join('\n');
                            embed.setDescription(list.length > 0 ? list.slice(0, 4000) : "**No roles whitelisted.**");
                        } else if (type === 'channels') {
                            embed.setAuthor('whitelist channels', 'https://cdn.discordapp.com/emojis/1461641597476274332.png');
                            const list = Array.from(channelIds).map((id, i) => `${i + 1}. <#${id}>`).join('\n');
                            embed.setDescription(list.length > 0 ? list.slice(0, 4000) : "**No channels whitelisted.**");
                        }
                        return embed;
                    };

                    const getRow = (disabled = false) => new ActionRowBuilder<ButtonBuilder>().addComponents(
                        new ButtonBuilder().setCustomId('wl_show_users').setLabel('Users').setStyle(ButtonStyle.Secondary).setEmoji(config.emojis.user).setDisabled(disabled),
                        new ButtonBuilder().setCustomId('wl_show_roles').setLabel('Roles').setStyle(ButtonStyle.Secondary).setEmoji(config.emojis.roles).setDisabled(disabled),
                        new ButtonBuilder().setCustomId('wl_show_channels').setLabel('Channels').setStyle(ButtonStyle.Secondary).setEmoji(config.emojis.general).setDisabled(disabled)
                    );

                    const reply = await interaction.reply((await getEmbed('users')).toPayload({ extraComponents: [getRow()] }));

                    const collector = reply.createMessageComponentCollector({ componentType: ComponentType.Button, time: 60000 });

                    collector.on('collect', async (i) => {
                        if (i.user.id !== interaction.user.id) {
                            await i.reply({ content: `${config.emojis.error} **Only the requester can use these buttons.**`, ephemeral: true });
                            return;
                        }

                        if (i.customId === 'wl_show_users') {
                            currentType = 'users';
                            await i.update((await getEmbed('users')).toPayload({ extraComponents: [getRow()] }));
                        } else if (i.customId === 'wl_show_roles') {
                            currentType = 'roles';
                            await i.update((await getEmbed('roles')).toPayload({ extraComponents: [getRow()] }));
                        } else if (i.customId === 'wl_show_channels') {
                            currentType = 'channels';
                            await i.update((await getEmbed('channels')).toPayload({ extraComponents: [getRow()] }));
                        }
                    });

                    collector.on('end', async () => {
                        reply.edit((await getEmbed(currentType)).toPayload({ extraComponents: [getRow(true)] })).catch(() => { });
                    });

                    return;
                } catch (err) {
                    console.error("Error in whitelist show prefix:", err);
                    await interaction.reply({ content: `Debug: ${err}` });
                    return;
                }
            }

            if (action === 'reset') {
                const categoryInput = possibleTarget?.toLowerCase() || 'all';
                const valid = ['all', 'links', 'invites', 'spam'];

                if (!valid.includes(categoryInput)) {
                    await interaction.reply({ content: `${config.emojis.error} **Invalid category. Valid categories: ${valid.join(', ')}**` });
                    return;
                }

                const guildData = await database.retrieveGuild(interaction.guild.id);
                if (guildData) {
                    if (!guildData.messageFilters) {
                        // Nothing to reset if it doesn't exist
                        await interaction.reply({ content: `${config.emojis.warning} **Whitelist is already empty for category: ${categoryInput}.**` });
                        return;
                    }

                    const targetKeys: ('linksWhitelist' | 'invitesWhitelist' | 'spamWhitelist')[] = [];
                    if (categoryInput === 'all') {
                        targetKeys.push('linksWhitelist', 'invitesWhitelist', 'spamWhitelist');
                    } else if (categoryInput === 'links') targetKeys.push('linksWhitelist');
                    else if (categoryInput === 'invites') targetKeys.push('invitesWhitelist');
                    else if (categoryInput === 'spam') targetKeys.push('spamWhitelist');

                    let changeCount = 0;
                    for (const key of targetKeys) {
                        const list = guildData.messageFilters[key];
                        if (list && (list.users.length > 0 || list.roles.length > 0 || list.channels.length > 0)) {
                            guildData.messageFilters[key] = { users: [], roles: [], channels: [] };
                            changeCount++;
                        }
                    }

                    if (changeCount > 0) {
                        await database.insertGuild(interaction.guild.id, guildData);
                        await interaction.reply({ content: `${config.emojis.success} **Successfully reset whitelist for category: ${categoryInput}.**` });
                    } else {
                        await interaction.reply({ content: `${config.emojis.warning} **Whitelist is already empty for category: ${categoryInput}.**` });
                    }
                }
                return;
            }

            // Handle Add/Remove (or implicit Add)
            let targetId = '';
            let commandMode = 'add'; // Default to add

            if (action === 'remove' || action === 'delete') {
                commandMode = 'remove';
                targetId = possibleTarget ? possibleTarget.replace(/[<@!&#>]/g, '') : '';
            } else if (action === 'add') {
                commandMode = 'add';
                targetId = possibleTarget ? possibleTarget.replace(/[<@!&#>]/g, '') : '';
            } else {
                // Shortcut: ?wl <id> -> Implicit Add
                targetId = action ? action.replace(/[<@!&#>]/g, '') : '';
            }

            if (/^\d{17,19}$/.test(targetId)) {
                let type: 'users' | 'roles' | 'channels' | null = null;
                try { if (await interaction.guild.members.fetch(targetId).catch(() => null)) type = 'users'; } catch { }
                if (!type) try { if (await interaction.guild.roles.fetch(targetId)) type = 'roles'; } catch { }
                if (!type) try { if (await interaction.guild.channels.fetch(targetId)) type = 'channels'; } catch { }

                if (type) {
                    const guildData = await database.retrieveGuild(interaction.guild.id);
                    if (guildData) {
                        // Ensure schema safety
                        if (!guildData.messageFilters) guildData.messageFilters = { linksWhitelist: { users: [], roles: [], channels: [] }, invitesWhitelist: { users: [], roles: [], channels: [] }, spamWhitelist: { users: [], roles: [], channels: [] } } as any;

                        if (!guildData.messageFilters.linksWhitelist) guildData.messageFilters.linksWhitelist = { users: [], roles: [], channels: [] };
                        if (!guildData.messageFilters.invitesWhitelist) guildData.messageFilters.invitesWhitelist = { users: [], roles: [], channels: [] };
                        if (!guildData.messageFilters.spamWhitelist) guildData.messageFilters.spamWhitelist = { users: [], roles: [], channels: [] };

                        const lists = ['linksWhitelist', 'invitesWhitelist', 'spamWhitelist'] as const;
                        let changeCount = 0;

                        for (const key of lists) {
                            const list = guildData.messageFilters[key][type];
                            if (commandMode === 'add') {
                                if (!list.includes(targetId)) {
                                    list.push(targetId);
                                    changeCount++;
                                }
                            } else {
                                if (list.includes(targetId)) {
                                    const index = list.indexOf(targetId);
                                    if (index > -1) {
                                        list.splice(index, 1);
                                        changeCount++;
                                    }
                                }
                            }
                        }

                        if (changeCount > 0) {
                            await database.insertGuild(interaction.guild.id, guildData);
                            await interaction.reply({ content: `${config.emojis.success} **Successfully ${commandMode === 'add' ? 'added' : 'removed'} <@${type === 'roles' ? '&' : type === 'channels' ? '#' : ''}${targetId}> ${commandMode === 'add' ? 'to' : 'from'} Master Whitelist.**` });
                        } else {
                            const typeName = type === 'users' ? 'User' : type === 'roles' ? 'Role' : 'Channel';
                            await interaction.reply({ content: `${config.emojis.warning} **${typeName} was ${commandMode === 'add' ? 'already in' : 'not found in'} Master Whitelist.**` });
                        }
                        return;
                    }
                }
            }
        }

        // Usage Help
        // Usage Help
        const helpEmbed = new V2Embed()
            .setColor(config.colors.default)
            .setTitle(`${config.emojis.antinuke} Whitelist Commands`)
            .setDescription(`> \`${config.prefix}wl add <user>\`\n> \`${config.prefix}wl remove <user>\`\n> \`${config.prefix}wl show\`\n> \`${config.prefix}wl reset all\``)
            .setThumbnail(interaction.client.user.displayAvatarURL())
            .setFooter(`Requested by ${interaction.user.tag}`, interaction.user.displayAvatarURL());

        await interaction.reply(helpEmbed.toPayload());
        return;
    }

    // ... (rest of the file for command arguments support remains unchanged) ...
    // Actually, I should just paste the rest of the file logic for 'prefix mode' argument handling below.
    // Wait, the previous replacement included lines 191-325. I must preserve that logic.

    // START OF PRESERVED LOGIC
    const user = interaction.options.getUser('user');
    const role = interaction.options.getRole('role');
    const channel = interaction.options.getChannel('channel');

    await interaction.deferReply();

    try {
        const guildData = await database.retrieveGuild(interaction.guild.id);
        if (!guildData) {
            await interaction.editReply({ content: `${config.emojis.error} **Database error.**` });
            return;
        }

        if (!guildData.messageFilters) {
            guildData.messageFilters = {
                linksWhitelist: { users: [], roles: [], channels: [] },
                invitesWhitelist: { users: [], roles: [], channels: [] },
                spamWhitelist: { users: [], roles: [], channels: [] }
            } as any;
        }

        if (!guildData.messageFilters.linksWhitelist) guildData.messageFilters.linksWhitelist = { users: [], roles: [], channels: [] };
        if (!guildData.messageFilters.invitesWhitelist) guildData.messageFilters.invitesWhitelist = { users: [], roles: [], channels: [] };
        if (!guildData.messageFilters.spamWhitelist) guildData.messageFilters.spamWhitelist = { users: [], roles: [], channels: [] };

        const targetKeys: ('linksWhitelist' | 'invitesWhitelist' | 'spamWhitelist')[] = [];
        if (category === 'all') {
            targetKeys.push('linksWhitelist', 'invitesWhitelist', 'spamWhitelist');
        } else if (category === 'links') {
            targetKeys.push('linksWhitelist');
        } else if (category === 'invites') {
            targetKeys.push('invitesWhitelist');
        } else if (category === 'spam') {
            targetKeys.push('spamWhitelist');
        }

        if (sub === 'add') {
            if (!user && !role && !channel) {
                await interaction.editReply({ content: `${config.emojis.error} **Please provide a user, role, or channel to whitelist.**` });
                return;
            }

            const added: string[] = [];

            for (const key of targetKeys) {
                const list = guildData.messageFilters[key];

                if (user && !list.users.includes(user.id)) {
                    list.users.push(user.id);
                    added.push(`[${key.replace('Whitelist', '')}] User: ${user.tag}`);
                }
                if (role && !list.roles.includes(role.id)) {
                    list.roles.push(role.id);
                    added.push(`[${key.replace('Whitelist', '')}] Role: ${role.name}`);
                }
                if (channel && !list.channels.includes(channel.id)) {
                    list.channels.push(channel.id);
                    added.push(`[${key.replace('Whitelist', '')}] Channel: ${channel.name}`);
                }
            }

            if (added.length === 0) {
                await interaction.editReply({ content: `${config.emojis.warning} **Selected items are already whitelisted in the selected specific category(s).**` });
                return;
            }

            await database.insertGuild(interaction.guild.id, guildData);

            const summary = userIdSummary(added);
            await interaction.editReply({ content: `${config.emojis.success} **Whitelisted Added:**\n${summary}` });

        } else if (sub === 'remove') {
            if (!user && !role && !channel) {
                await interaction.editReply({ content: `${config.emojis.error} **Please provide a user, role, or channel to remove.**` });
                return;
            }

            const removed: string[] = [];

            for (const key of targetKeys) {
                const list = guildData.messageFilters[key];

                if (user && list.users.includes(user.id)) {
                    guildData.messageFilters[key].users = list.users.filter(id => id !== user.id);
                    removed.push(`[${key.replace('Whitelist', '')}] User: ${user.tag}`);
                }
                if (role && list.roles.includes(role.id)) {
                    guildData.messageFilters[key].roles = list.roles.filter(id => id !== role.id);
                    removed.push(`[${key.replace('Whitelist', '')}] Role: ${role.name}`);
                }
                if (channel && list.channels.includes(channel.id)) {
                    guildData.messageFilters[key].channels = list.channels.filter(id => id !== channel.id);
                    removed.push(`[${key.replace('Whitelist', '')}] Channel: ${channel.name}`);
                }
            }

            if (removed.length === 0) {
                await interaction.editReply({ content: `${config.emojis.warning} **Selected items were not in the whitelist.**` });
                return;
            }

            await database.insertGuild(interaction.guild.id, guildData);
            const summary = userIdSummary(removed);
            await interaction.editReply({ content: `${config.emojis.success} **Whitelisted Removed:**\n${summary}` });

        } else if (sub === 'show') {
            const userIds = new Set<string>();
            const roleIds = new Set<string>();
            const channelIds = new Set<string>();

            for (const key of targetKeys) {
                const list = guildData.messageFilters[key];
                list.users.forEach(id => userIds.add(id));
                list.roles.forEach(id => roleIds.add(id));
                list.channels.forEach(id => channelIds.add(id));
            }

            let currentType: 'users' | 'roles' | 'channels' = 'users';
            const getEmbed = async (type: 'users' | 'roles' | 'channels') => {
                const embed = new V2Embed()
                    .setColor(config.colors.primary)
                    .setFooter(`Requested by ${interaction.user.tag}`, interaction.user.displayAvatarURL());

                if (type === 'users') {
                    embed.setAuthor('whitelist users', 'https://cdn.discordapp.com/emojis/1461641597476274332.png');
                    const ids = Array.from(userIds);
                    const names = await Promise.all(ids.map(async id => {
                        try {
                            const user = await interaction.client.users.fetch(id);
                            return user.username;
                        } catch {
                            return `Unknown (${id})`;
                        }
                    }));
                    const list = names.map((name, i) => `\`「${i + 1}」\` | \`${name}「${ids[i]}」\``).join('\n');
                    embed.setDescription(list.length > 0 ? list.slice(0, 4000) : "**No users whitelisted.**");
                } else if (type === 'roles') {
                    embed.setAuthor('whitelist roles', 'https://cdn.discordapp.com/emojis/1461641597476274332.png');
                    const list = Array.from(roleIds).map((id, i) => `${i + 1}. <@&${id}>`).join('\n');
                    embed.setDescription(list.length > 0 ? list.slice(0, 4000) : "**No roles whitelisted.**");
                } else if (type === 'channels') {
                    embed.setAuthor('whitelist channels', 'https://cdn.discordapp.com/emojis/1461641597476274332.png');
                    const list = Array.from(channelIds).map((id, i) => `${i + 1}. <#${id}>`).join('\n');
                    embed.setDescription(list.length > 0 ? list.slice(0, 4000) : "**No channels whitelisted.**");
                }
                return embed;
            };

            const getRow = (disabled = false) => new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder().setCustomId('wl_show_users').setLabel('Users').setStyle(ButtonStyle.Secondary).setEmoji(config.emojis.user).setDisabled(disabled),
                new ButtonBuilder().setCustomId('wl_show_roles').setLabel('Roles').setStyle(ButtonStyle.Secondary).setEmoji(config.emojis.roles).setDisabled(disabled),
                new ButtonBuilder().setCustomId('wl_show_channels').setLabel('Channels').setStyle(ButtonStyle.Secondary).setEmoji(config.emojis.general).setDisabled(disabled)
            );

            const reply = await interaction.editReply((await getEmbed('users')).toPayload({ extraComponents: [getRow()] }));

            const collector = reply.createMessageComponentCollector({ componentType: ComponentType.Button, time: 60000 });

            collector.on('collect', async (i) => {
                if (i.user.id !== interaction.user.id) {
                    await i.reply({ content: `${config.emojis.error} **Only the requester can use these buttons.**`, ephemeral: true });
                    return;
                }

                if (i.customId === 'wl_show_users') {
                    currentType = 'users';
                    await i.update((await getEmbed('users')).toPayload({ extraComponents: [getRow()] }));
                } else if (i.customId === 'wl_show_roles') {
                    currentType = 'roles';
                    await i.update((await getEmbed('roles')).toPayload({ extraComponents: [getRow()] }));
                } else if (i.customId === 'wl_show_channels') {
                    currentType = 'channels';
                    await i.update((await getEmbed('channels')).toPayload({ extraComponents: [getRow()] }));
                }
            });

            collector.on('end', async () => {
                reply.edit((await getEmbed(currentType)).toPayload({ extraComponents: [getRow(true)] })).catch(() => { });
            });

        } else if (sub === 'reset') {
            let changeCount = 0;
            for (const key of targetKeys) {
                if (guildData.messageFilters[key].users.length > 0 || guildData.messageFilters[key].roles.length > 0 || guildData.messageFilters[key].channels.length > 0) {
                    guildData.messageFilters[key] = { users: [], roles: [], channels: [] };
                    changeCount++;
                }
            }

            if (changeCount > 0) {
                await database.insertGuild(interaction.guild.id, guildData);
                await interaction.editReply({ content: `${config.emojis.success} **Successfully reset whitelist for category: ${category}.**` });
            } else {
                await interaction.editReply({ content: `${config.emojis.warning} **Whitelist is already empty for category: ${category}.**` });
            }
        }

    } catch (error) {
        console.error(error);
        await interaction.editReply({ content: `${config.emojis.error} **Failed to update whitelist.**` });
    }
}

function userIdSummary(items: string[]): string {
    return items.slice(0, 20).join('\n') + (items.length > 20 ? `\n...and ${items.length - 20} more` : '');
}
