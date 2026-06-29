const { 
    PermissionsBitField, 
    ChannelType, 
    ActionRowBuilder, 
    ChannelSelectMenuBuilder, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle, 
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');
const { QueueRepeatMode } = require('discord-player');
const { db, saveDB, ongoingSetups, logToChannel } = require('../db');
const { getInterfaceMessage } = require('../ui');
const { CommentModal, ConfessionButtons, ConfessionModal, StartView } = require('../confessions');
const ALLOWED_USER_IDS = ['1364624416532725861', '243748917311700992'];

module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        const emojis = {
            lock: interaction.guild?.emojis.cache.find(e => e.name === 'vm_lock'),
            unlock: interaction.guild?.emojis.cache.find(e => e.name === 'vm_unlock'),
            ghost: interaction.guild?.emojis.cache.find(e => e.name === 'vm_ghost'),
            reveal: interaction.guild?.emojis.cache.find(e => e.name === 'vm_reveal'),
            rename: interaction.guild?.emojis.cache.find(e => e.name === 'vm_rename'),
            claim: interaction.guild?.emojis.cache.find(e => e.name === 'vm_claim'),
            increase: interaction.guild?.emojis.cache.find(e => e.name === 'vm_increase'),
            decrease: interaction.guild?.emojis.cache.find(e => e.name === 'vm_decrease'),
            delete: interaction.guild?.emojis.cache.find(e => e.name === 'vm_delete'),
            info: interaction.guild?.emojis.cache.find(e => e.name === 'vm_info'),
            add: interaction.guild?.emojis.cache.find(e => e.name === 'vm_add')
        };
        const getStr = (em, fallback) => em ? `<:${em.name}:${em.id}>` : fallback;

        // Gestione Comandi Slash (Chat Inputs)
        if (interaction.isChatInputCommand()) {
            const { commandName } = interaction;

            // 1. /help
            if (commandName === 'help') {
                const { getHelpPage } = require('../help');
                const isAdmin = interaction.member.permissions.has(PermissionsBitField.Flags.Administrator) || ALLOWED_USER_IDS.includes(interaction.user.id);
                const helpPayload = getHelpPage(1, interaction.user.id, isAdmin);
                await interaction.reply(helpPayload);
                return;
            }

            // 2. /status
            if (commandName === 'status') {
                const guild = interaction.guild;
                const owner = await guild.fetchOwner();
                const embed = new EmbedBuilder()
                    .setAuthor({ name: guild.name, iconURL: guild.iconURL({ dynamic: true }) || undefined })
                    .setTitle('Server Status')
                    .setColor('#DCE2F0')
                    .addFields(
                        { name: 'Total Members', value: `\`${guild.memberCount}\``, inline: true },
                        { name: 'Owner', value: `\`${owner.user.tag}\``, inline: true },
                        { name: 'Created At', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>\n(<t:${Math.floor(guild.createdTimestamp / 1000)}:R>)`, inline: false },
                        { name: 'Channels', value: `Text: **${guild.channels.cache.filter(c => c.type === ChannelType.GuildText).size}**\nVoice: **${guild.channels.cache.filter(c => c.type === ChannelType.GuildVoice).size}**`, inline: false }
                    )
                    .setThumbnail(guild.iconURL({ dynamic: true, size: 512 }) || 'https://i.imgur.com/AwxsXJz.png')
                    .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
                    .setTimestamp();
                await interaction.reply({ embeds: [embed] });
                return;
            }

            // 3. /emoji-setup
            if (commandName === 'emoji-setup') {
                if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                    return interaction.reply({ content: "You do not have permission to use this command.", flags: ['Ephemeral'] });
                }
                await interaction.deferReply();
                const emojisToUpload = [
                    { name: 'vm_lock', url: 'https://cdn.discordapp.com/emojis/1422720898892300388.webp?size=40' },
                    { name: 'vm_unlock', url: 'https://cdn.discordapp.com/emojis/1422720958564798514.webp?size=40' },
                    { name: 'vm_ghost', url: 'https://cdn.discordapp.com/emojis/1422720885311143956.webp?size=40' },
                    { name: 'vm_reveal', url: 'https://cdn.discordapp.com/emojis/1422720923047297184.webp?size=40' },
                    { name: 'vm_rename', url: 'https://cdn.discordapp.com/emojis/1422720915778830357.webp?size=40' },
                    { name: 'vm_claim', url: 'https://cdn.discordapp.com/emojis/1422720904382644345.webp?size=40' },
                    { name: 'vm_increase', url: 'https://cdn.discordapp.com/emojis/1422720868081209394.webp?size=40' },
                    { name: 'vm_decrease', url: 'https://cdn.discordapp.com/emojis/1422720949542846584.webp?size=40' },
                    { name: 'vm_delete', url: 'https://cdn.discordapp.com/emojis/1422720875408523384.webp?size=40' },
                    { name: 'vm_info', url: 'https://cdn.discordapp.com/emojis/1422720892944908378.webp?size=40' }
                ];
                
                let uploaded = 0;
                for (const em of emojisToUpload) {
                    try {
                        const existing = interaction.guild.emojis.cache.find(e => e.name === em.name);
                        if (existing) await existing.delete();
                        await interaction.guild.emojis.create({ attachment: em.url, name: em.name });
                        uploaded++;
                    } catch (err) {
                        console.error(err);
                    }
                }
                await interaction.editReply(`✅ Successfully uploaded/updated **${uploaded}** emojis. You can now run \`/reload\` if you want to update the panels.`);
                return;
            }

            // 4. /reload
            if (commandName === 'reload') {
                if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                    return interaction.reply({ content: "You do not have permission to use this command.", flags: ['Ephemeral'] });
                }
                await interaction.deferReply();
                const setup = db.setups[interaction.guild.id];
                if (!setup) return interaction.editReply("No active setup found to reload.");
                try {
                    const category = interaction.guild.channels.cache.get(setup.categoryId) || await interaction.guild.channels.fetch(setup.categoryId).catch(() => null);
                    if (category) {
                        for (const [id, channel] of category.children.cache) {
                            await channel.delete().catch(() => {});
                        }
                        await category.delete().catch(() => {});
                    }
                    if (setup.logChannelId) {
                        const logChannel = interaction.guild.channels.cache.get(setup.logChannelId) || await interaction.guild.channels.fetch(setup.logChannelId).catch(() => null);
                        if (logChannel) {
                            const logCat = logChannel.parent;
                            await logChannel.delete().catch(() => {});
                            if (logCat && logCat.children.cache.size === 0) await logCat.delete().catch(() => {});
                        }
                    }
                    delete db.setups[interaction.guild.id];

                    const newCategory = await interaction.guild.channels.create({ name: 'Voice Channels', type: ChannelType.GuildCategory });
                    const textChannel = await interaction.guild.channels.create({ name: 'cmd', type: ChannelType.GuildText, parent: newCategory.id });
                    const joinChannel = await interaction.guild.channels.create({ name: 'Join to Create', type: ChannelType.GuildVoice, parent: newCategory.id });
                    const logCategory = await interaction.guild.channels.create({ name: 'Logs', type: ChannelType.GuildCategory });
                    const logChannel = await interaction.guild.channels.create({
                        name: 'server-logs',
                        type: ChannelType.GuildText,
                        parent: logCategory.id,
                        permissionOverwrites: [{ id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] }]
                    });

                    db.setups[interaction.guild.id] = {
                        categoryId: newCategory.id,
                        joinChannelId: joinChannel.id,
                        textChannelId: textChannel.id,
                        logChannelId: logChannel.id
                    };
                    saveDB();

                    const logEmbed = new EmbedBuilder()
                        .setTitle("🟢 Log bot is now active")
                        .setDescription(`**Bot:** ${interaction.client.user}\n**Servers:** ${interaction.client.guilds.cache.size}\n\n**Features active:**\n• ✅ Deleted messages (with media)\n• ✅ Edited messages\n• ✅ Voice channel events\n• ✅ Profile changes\n• ✅ Nickname changes\n• ✅ Member join/leave\n• ✅ Ban/Kick logs\n• ✅ Channel create/delete/edit\n• ✅ Role changes\n• ✅ Bulk message delete\n• ✅ Thread events`)
                        .setColor('#2ECC71')
                        .setTimestamp();
                    await logChannel.send({ embeds: [logEmbed] }).catch(() => {});

                    const interfaceMsg = getInterfaceMessage(interaction.guild);
                    await textChannel.send(interfaceMsg);
                    await interaction.editReply(`Reload completed. New interface created in <#${textChannel.id}>.`);
                } catch (err) {
                    console.error(err);
                    await interaction.editReply("An error occurred during reload.");
                }
                return;
            }

            // 5. /dm
            if (commandName === 'dm') {
                if (!ALLOWED_USER_IDS.includes(interaction.user.id) && !interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                    return interaction.reply({ content: "❌ You are not authorized to use this command.", flags: ['Ephemeral'] });
                }
                const target = interaction.options.getUser('user');
                const msgContent = interaction.options.getString('message');
                try {
                    await target.send(msgContent);
                    await interaction.reply({ content: `✅ Sent to ${target.displayName || target.username}`, flags: ['Ephemeral'] });
                } catch (error) {
                    await interaction.reply({ content: '❌ DMs closed or user not found', flags: ['Ephemeral'] });
                }
                return;
            }

            // 6. /vc-setup
            if (commandName === 'vc-setup') {
                if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                    return interaction.reply({ content: "You do not have permission to use this command.", flags: ['Ephemeral'] });
                }
                const setupEmbed = new EmbedBuilder()
                    .setTitle('VoiceMaster Setup')
                    .setDescription('Choose how you want to configure VoiceMaster:\n\n**Automatic Setup**: Create everything from scratch (Category, Text Channel, Voice Channel).\n**Manual Setup**: Use an existing category and voice channel.')
                    .setColor('#DCE2F0');
                const setupRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('setup_auto').setLabel('Automatic Setup').setStyle(ButtonStyle.Primary),
                    new ButtonBuilder().setCustomId('setup_manual').setLabel('Manual Setup').setStyle(ButtonStyle.Secondary)
                );
                await interaction.reply({ embeds: [setupEmbed], components: [setupRow] });
                return;
            }

            // 7. /vc-remove
            if (commandName === 'vc-remove') {
                if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                    return interaction.reply({ content: "You do not have permission to use this command.", flags: ['Ephemeral'] });
                }
                const setup = db.setups[interaction.guild.id];
                if (!setup) return interaction.reply({ content: "No active setup found in this server.", flags: ['Ephemeral'] });
                await interaction.deferReply();
                try {
                    const category = interaction.guild.channels.cache.get(setup.categoryId) || await interaction.guild.channels.fetch(setup.categoryId).catch(() => null);
                    if (category) {
                        for (const [id, channel] of category.children.cache) {
                            await channel.delete().catch(() => {});
                        }
                        await category.delete().catch(() => {});
                    }
                    delete db.setups[interaction.guild.id];
                    saveDB();
                    await interaction.editReply("VoiceMaster setup removed successfully.");
                } catch (error) {
                    console.error(error);
                    await interaction.editReply("An error occurred while removing the setup.");
                }
                return;
            }

            // 8. /log-setup
            if (commandName === 'log-setup') {
                if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                    return interaction.reply({ content: "You do not have permission to use this command.", flags: ['Ephemeral'] });
                }
                await interaction.deferReply();
                try {
                    const logCategory = await interaction.guild.channels.create({ name: 'Logs', type: ChannelType.GuildCategory });
                    const logChannel = await interaction.guild.channels.create({
                        name: 'server-logs',
                        type: ChannelType.GuildText,
                        parent: logCategory.id,
                        permissionOverwrites: [{ id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] }]
                    });
                    if (!db.setups[interaction.guild.id]) db.setups[interaction.guild.id] = {};
                    db.setups[interaction.guild.id].logChannelId = logChannel.id;
                    saveDB();

                    const logEmbed = new EmbedBuilder()
                        .setTitle("🟢 Log bot is now active")
                        .setDescription(`**Bot:** ${interaction.client.user}\n**Servers:** ${interaction.client.guilds.cache.size}\n\n**Features active:**\n• ✅ Deleted messages (with media)\n• ✅ Edited messages\n• ✅ Voice channel events\n• ✅ Profile changes\n• ✅ Nickname changes\n• ✅ Member join/leave\n• ✅ Ban/Kick logs\n• ✅ Channel create/delete/edit\n• ✅ Role changes\n• ✅ Bulk message delete\n• ✅ Thread events`)
                        .setColor('#2ECC71')
                        .setTimestamp();
                    await logChannel.send({ embeds: [logEmbed] }).catch(() => {});

                    await interaction.editReply("Logs setup completed.");
                } catch (error) {
                    console.error(error);
                    await interaction.editReply("An error occurred during log setup.");
                }
                return;
            }

            // 9. /log-remove
            if (commandName === 'log-remove') {
                if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                    return interaction.reply({ content: "You do not have permission to use this command.", flags: ['Ephemeral'] });
                }
                const setup = db.setups[interaction.guild.id];
                if (!setup || !setup.logChannelId) return interaction.reply({ content: "No log setup found.", flags: ['Ephemeral'] });
                await interaction.deferReply();
                try {
                    const logChannel = interaction.guild.channels.cache.get(setup.logChannelId) || await interaction.guild.channels.fetch(setup.logChannelId).catch(() => null);
                    if (logChannel) {
                        const logCat = logChannel.parent;
                        await logChannel.delete().catch(() => {});
                        if (logCat && logCat.children.cache.size === 0) await logCat.delete().catch(() => {});
                    }
                    delete db.setups[interaction.guild.id].logChannelId;
                    saveDB();
                    await interaction.editReply("Logs setup removed.");
                } catch (error) {
                    console.error(error);
                    await interaction.editReply("An error occurred while removing the log setup.");
                }
                return;
            }

            // 10. /global-setup
            if (commandName === 'global-setup') {
                if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                    return interaction.reply({ content: "You do not have permission to use this command.", flags: ['Ephemeral'] });
                }
                await interaction.deferReply();
                try {
                    const category = await interaction.guild.channels.create({ name: 'Voice Channels', type: ChannelType.GuildCategory });
                    const textChannel = await interaction.guild.channels.create({ name: 'cmd', type: ChannelType.GuildText, parent: category.id });
                    const joinChannel = await interaction.guild.channels.create({ name: 'Join to Create', type: ChannelType.GuildVoice, parent: category.id });
                    const logCategory = await interaction.guild.channels.create({ name: 'Logs', type: ChannelType.GuildCategory });
                    const logChannel = await interaction.guild.channels.create({
                        name: 'server-logs',
                        type: ChannelType.GuildText,
                        parent: logCategory.id,
                        permissionOverwrites: [{ id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] }]
                    });

                    db.setups[interaction.guild.id] = {
                        categoryId: category.id,
                        joinChannelId: joinChannel.id,
                        textChannelId: textChannel.id,
                        logChannelId: logChannel.id
                    };
                    saveDB();

                    const logEmbed = new EmbedBuilder()
                        .setTitle("🟢 Log bot is now active")
                        .setDescription(`**Bot:** ${interaction.client.user}\n**Servers:** ${interaction.client.guilds.cache.size}\n\n**Features active:**\n• ✅ Deleted messages (with media)\n• ✅ Edited messages\n• ✅ Voice channel events\n• ✅ Profile changes\n• ✅ Nickname changes\n• ✅ Member join/leave\n• ✅ Ban/Kick logs\n• ✅ Channel create/delete/edit\n• ✅ Role changes\n• ✅ Bulk message delete\n• ✅ Thread events`)
                        .setColor('#2ECC71')
                        .setTimestamp();
                    await logChannel.send({ embeds: [logEmbed] }).catch(() => {});

                    const interfaceMsg = getInterfaceMessage(interaction.guild);
                    await textChannel.send(interfaceMsg);
                    await interaction.editReply(`Global setup completed. Interface created in <#${textChannel.id}> and logs in <#${logChannel.id}>.`);
                } catch (error) {
                    console.error(error);
                    await interaction.editReply("An error occurred during global setup.");
                }
                return;
            }

            // 11. /setupconfession
            if (commandName === 'setupconfession') {
                if (!ALLOWED_USER_IDS.includes(interaction.user.id) && !interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                    return interaction.reply({ content: "❌ You are not authorized to use this command.", flags: ['Ephemeral'] });
                }
                const embed = new EmbedBuilder()
                    .setTitle('✉️ Anonymous Confessions')
                    .setDescription('Click the button below to send a confession')
                    .setColor(0x2B2D31);
                const confessionChannelId = process.env.CONFESSION_CHANNEL_ID || interaction.channel.id;
                const startView = new StartView(confessionChannelId);
                await interaction.channel.send({ embeds: [embed], components: startView.getComponents() });
                await interaction.reply({ content: "✅ Confessions panel has been set up.", flags: ['Ephemeral'] });
                return;
            }

            // 12. /purge
            if (commandName === 'purge') {
                if (!ALLOWED_USER_IDS.includes(interaction.user.id) && !interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                    return interaction.reply({ content: "❌ You are not authorized to use this command.", flags: ['Ephemeral'] });
                }
                const amount = interaction.options.getInteger('amount');
                await interaction.deferReply({ flags: ['Ephemeral'] });
                await interaction.channel.bulkDelete(amount, true).then(async deleted => {
                    await interaction.editReply(`✅ Deleted ${deleted.size} messages.`);
                }).catch(e => {
                    interaction.editReply("❌ Error deleting messages.");
                });
                return;
            }

            // 13. /ticket-setup
            if (commandName === 'ticket-setup') {
                if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                    return interaction.reply({ content: "❌ You are not authorized to use this command.", flags: ['Ephemeral'] });
                }
                
                const category = interaction.options.getChannel('category');
                const panelChannel = interaction.options.getChannel('panel_channel');
                const logChannel = interaction.options.getChannel('log_channel');

                if (category.type !== ChannelType.GuildCategory) {
                    return interaction.reply({ content: "❌ Please select a valid Category.", flags: ['Ephemeral'] });
                }
                if (panelChannel.type !== ChannelType.GuildText) {
                    return interaction.reply({ content: "❌ Please select a valid Text Channel for the panel.", flags: ['Ephemeral'] });
                }
                if (logChannel.type !== ChannelType.GuildText) {
                    return interaction.reply({ content: "❌ Please select a valid Text Channel for the logs.", flags: ['Ephemeral'] });
                }

                if (!db.setups[interaction.guild.id]) db.setups[interaction.guild.id] = {};
                db.setups[interaction.guild.id].ticketCategoryId = category.id;
                db.setups[interaction.guild.id].ticketPanelChannelId = panelChannel.id;
                db.setups[interaction.guild.id].ticketLogChannelId = logChannel.id;
                saveDB();

                const embed = new EmbedBuilder()
                    .setTitle('🎫 Support Tickets')
                    .setDescription('Click the button below to open a new support ticket.')
                    .setColor('#5865F2')
                    .setFooter({ text: 'Support System' });
                
                const emojiAdd = interaction.guild?.emojis.cache.find(e => e.name === 'vm_add');
                const btnOpen = new ButtonBuilder()
                    .setCustomId('ticket_open')
                    .setLabel('Open Ticket')
                    .setStyle(ButtonStyle.Primary);
                if (emojiAdd) btnOpen.setEmoji(emojiAdd.id);
                else btnOpen.setEmoji('🎫');

                const row = new ActionRowBuilder().addComponents(btnOpen);

                await panelChannel.send({ embeds: [embed], components: [row] });
                
                await interaction.reply({ content: `✅ Ticket system setup completed!\nCategory: <#${category.id}>\nPanel: <#${panelChannel.id}>\nLogs: <#${logChannel.id}>`, flags: ['Ephemeral'] });
                return;
            }

            // 14. /play
            if (commandName === 'play') {
                const voiceChannel = interaction.member.voice.channel;
                if (!voiceChannel) {
                    return interaction.reply({ embeds: [new EmbedBuilder().setColor('#ED4245').setDescription('❌ You need to be in a voice channel to play music!')], flags: ['Ephemeral'] });
                }
                const query = interaction.options.getString('song');
                await interaction.deferReply();
                try {
                    const { track } = await interaction.client.player.play(voiceChannel, query, {
                        nodeOptions: {
                            metadata: interaction,
                            leaveOnEmpty: true,
                            leaveOnEmptyCooldown: 30000,
                            leaveOnEnd: true,
                            leaveOnEndCooldown: 30000,
                            async onBeforeCreateStream(track, source, _queue) {
                                try {
                                    const ytdl = require('youtube-dl-exec');
                                    const play = require('play-dl');
                                    const url = track.url || '';
                                    let targetUrl = '';
                                    if (source === 'spotifySong' || source === 'spotifyPlaylist' || source === 'spotifyAlbum' || url.includes('spotify.com')) {
                                        const title = track.title || 'Unknown Title';
                                        const author = track.author || 'Unknown Artist';
                                        const searchTerms = `${author} - ${title}`.trim();
                                        const rawQuery = searchTerms ? `ytsearch1:${searchTerms}` : url;
                                        const isWindows = process.platform === 'win32';
                                        const targetQuery = isWindows && searchTerms ? `"${rawQuery}"` : rawQuery;
                                        const output = await ytdl(targetQuery, {
                                            dumpSingleJson: true,
                                            noWarnings: true,
                                            noCheckCertificate: true,
                                            preferFreeFormats: true,
                                            format: 'bestaudio/best',
                                        });
                                        if (output && output.entries && output.entries.length > 0) {
                                            targetUrl = output.entries[0].webpage_url || output.entries[0].url;
                                        } else if (output && output.webpage_url) {
                                            targetUrl = output.webpage_url;
                                        }
                                    } else {
                                        targetUrl = url;
                                    }
                                    if (targetUrl) {
                                        const stream = await play.stream(targetUrl);
                                        if (stream && stream.stream) {
                                            return { stream: stream.stream, type: stream.type };
                                        }
                                    }
                                } catch (err) {
                                    console.error('[MUSIC-DEBUG] Error inside onBeforeCreateStream:', err);
                                }
                                return null;
                            }
                        }
                    });
                    const playEmbed = new EmbedBuilder()
                        .setColor('#57F287')
                        .setTitle('🎶 Added to Queue & Playing')
                        .setDescription(`[${track.title}](${track.url})`)
                        .addFields(
                            { name: '👤 Author', value: `\`${track.author || 'Unknown'}\``, inline: true },
                            { name: '⏱️ Duration', value: `\`${track.duration}\``, inline: true },
                            { name: '🎧 Requested By', value: `${interaction.user}`, inline: true }
                        )
                        .setThumbnail(track.thumbnail || null);
                    await interaction.editReply({ embeds: [playEmbed] });
                } catch (e) {
                    console.error(e);
                    await interaction.editReply({ embeds: [new EmbedBuilder().setColor('#ED4245').setDescription('❌ Failed to play the track.')] });
                }
                return;
            }

            // Get active queue for other music commands
            const musicQueueCommands = ['stop', 'skip', 'pause', 'resume', 'nowplaying', 'volume', 'loop', 'shuffle', 'remove', 'clear', 'queue', 'autoplay', 'seek'];
            if (musicQueueCommands.includes(commandName)) {
                const queue = interaction.client.player.nodes.get(interaction.guild.id);
                if (!queue || !queue.isPlaying()) {
                    return interaction.reply({ embeds: [new EmbedBuilder().setColor('#ED4245').setDescription('❌ No music is currently playing in this server!')], flags: ['Ephemeral'] });
                }

                if (commandName === 'stop') {
                    queue.delete();
                    await interaction.reply({ embeds: [new EmbedBuilder().setColor('#ED4245').setDescription('🛑 Music playback stopped and bot left the voice channel.')] });
                    return;
                }

                if (commandName === 'skip') {
                    queue.node.skip();
                    await interaction.reply({ embeds: [new EmbedBuilder().setColor('#57F287').setDescription('⏭️ Skipped current track.')] });
                    return;
                }

                if (commandName === 'pause') {
                    queue.node.setPaused(true);
                    await interaction.reply({ embeds: [new EmbedBuilder().setColor('#A370F7').setDescription('⏸️ Paused the music.')] });
                    return;
                }

                if (commandName === 'resume') {
                    queue.node.setPaused(false);
                    await interaction.reply({ embeds: [new EmbedBuilder().setColor('#57F287').setDescription('▶️ Resumed music playback.')] });
                    return;
                }

                if (commandName === 'nowplaying') {
                    const track = queue.currentTrack;
                    const progress = queue.node.createProgressBar();
                    const embed = new EmbedBuilder()
                        .setColor('#A370F7')
                        .setTitle('🎧 Now Playing')
                        .setDescription(`[${track.title}](${track.url})\n\n${progress}`)
                        .addFields(
                            { name: '👤 Author', value: `\`${track.author || 'Unknown'}\``, inline: true },
                            { name: '⏱️ Duration', value: `\`${track.duration}\``, inline: true },
                            { name: '🎧 Requested By', value: `${track.requestedBy || 'Unknown'}`, inline: true }
                        )
                        .setThumbnail(track.thumbnail || null);
                    await interaction.reply({ embeds: [embed] });
                    return;
                }

                if (commandName === 'volume') {
                    const vol = interaction.options.getInteger('level');
                    queue.node.setVolume(vol);
                    await interaction.reply({ embeds: [new EmbedBuilder().setColor('#57F287').setDescription(`🔊 Volume updated to **${vol}%**.`)] });
                    return;
                }

                if (commandName === 'loop') {
                    const mode = interaction.options.getString('mode');
                    let nextMode = QueueRepeatMode.OFF;
                    let replyStr = "Loop mode turned **OFF**.";
                    if (mode === 'track') {
                        nextMode = QueueRepeatMode.TRACK;
                        replyStr = "Looping current **TRACK**.";
                    } else if (mode === 'queue') {
                        nextMode = QueueRepeatMode.QUEUE;
                        replyStr = "Looping entire **QUEUE**.";
                    }
                    queue.setRepeatMode(nextMode);
                    await interaction.reply({ embeds: [new EmbedBuilder().setColor('#A370F7').setDescription(`🔁 ${replyStr}`)] });
                    return;
                }

                if (commandName === 'shuffle') {
                    queue.tracks.shuffle();
                    await interaction.reply({ embeds: [new EmbedBuilder().setColor('#57F287').setDescription('🔀 Queue successfully shuffled!')] });
                    return;
                }

                if (commandName === 'remove') {
                    const index = interaction.options.getInteger('index');
                    if (index < 1 || index > queue.tracks.size) {
                        return interaction.reply({ embeds: [new EmbedBuilder().setColor('#ED4245').setDescription(`❌ Provide a valid track number between \`1\` and \`${queue.tracks.size}\`.`)], flags: ['Ephemeral'] });
                    }
                    const removedTrack = queue.node.remove(index - 1);
                    await interaction.reply({ embeds: [new EmbedBuilder().setColor('#57F287').setDescription(`🗑️ Removed **${removedTrack.title}** from the queue.`)] });
                    return;
                }

                if (commandName === 'clear') {
                    queue.tracks.clear();
                    await interaction.reply({ embeds: [new EmbedBuilder().setColor('#ED4245').setDescription('🗑️ Queue cleared successfully.')] });
                    return;
                }

                if (commandName === 'queue') {
                    const upcoming = queue.tracks.toArray();
                    if (upcoming.length === 0) {
                        const embed = new EmbedBuilder()
                            .setColor('#A370F7')
                            .setTitle('🎵 Server Queue')
                            .setDescription(`**Now Playing:** [${queue.currentTrack.title}](${queue.currentTrack.url})\n\n*No upcoming tracks in queue.*`);
                        return interaction.reply({ embeds: [embed] });
                    }
                    const trackList = upcoming.slice(0, 10).map((t, idx) => `**${idx + 1}.** [${t.title}](${t.url}) - \`${t.duration}\``).join('\n');
                    const embed = new EmbedBuilder()
                        .setColor('#A370F7')
                        .setTitle('🎵 Server Queue')
                        .setDescription(`**Now Playing:** [${queue.currentTrack.title}](${queue.currentTrack.url})\n\n**Upcoming:**\n${trackList}${upcoming.length > 10 ? `\n\n*...and ${upcoming.length - 10} more tracks*` : ''}`)
                        .setFooter({ text: `${upcoming.length} tracks in queue` });
                    await interaction.reply({ embeds: [embed] });
                    return;
                }

                if (commandName === 'autoplay') {
                    const nextMode = queue.repeatMode === QueueRepeatMode.AUTOPLAY ? QueueRepeatMode.OFF : QueueRepeatMode.AUTOPLAY;
                    queue.setRepeatMode(nextMode);
                    await interaction.reply({ embeds: [new EmbedBuilder().setColor('#A370F7').setDescription(`📻 Autoplay mode has been turned **${nextMode === QueueRepeatMode.AUTOPLAY ? 'ON' : 'OFF'}**.`)] });
                    return;
                }

                if (commandName === 'seek') {
                    const time = interaction.options.getInteger('seconds');
                    queue.node.seek(time * 1000);
                    await interaction.reply({ embeds: [new EmbedBuilder().setColor('#57F287').setDescription(`⏩ Seeked to **${time}s**.`)] });
                    return;
                }
            }


        }

        // Gestione Menu a Tendina per Setup Manuale
        if (interaction.isChannelSelectMenu()) {
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) return interaction.reply({ content: 'You do not have permission.', flags: ['Ephemeral'] });

            if (interaction.customId === 'setup_select_cat') {
                const selectedCatId = interaction.values[0];
                ongoingSetups.set(interaction.message.id, { categoryId: selectedCatId });
                
                const voiceRow = new ActionRowBuilder().addComponents(
                    new ChannelSelectMenuBuilder()
                        .setCustomId('setup_select_voice')
                        .setPlaceholder('Select Voice Channel')
                        .addChannelTypes(ChannelType.GuildVoice)
                );
                await interaction.update({ content: 'Select the voice channel for "Join to Create":', components: [voiceRow] });
                return;
            }

            if (interaction.customId === 'setup_select_voice') {
                const selectedVoiceId = interaction.values[0];
                const setupData = ongoingSetups.get(interaction.message.id);
                if (!setupData) return interaction.reply({ content: 'Session expired, please run the setup command again.', flags: ['Ephemeral'] });
                
                await interaction.deferReply({ flags: ['Ephemeral'] });
                await interaction.message.delete().catch(() => {});
                
                try {
                    const textChannel = await interaction.guild.channels.create({
                        name: 'cmd',
                        type: ChannelType.GuildText,
                        parent: setupData.categoryId
                    });

                    db.setups[interaction.guild.id] = {
                        categoryId: setupData.categoryId,
                        joinChannelId: selectedVoiceId,
                        textChannelId: textChannel.id
                    };
                    saveDB();
                    
                    const interfaceMsg = getInterfaceMessage(interaction.guild);
                    await textChannel.send(interfaceMsg);
                    ongoingSetups.delete(interaction.message.id);
                    
                    await interaction.editReply(`Manual setup completed. Interface created in <#${textChannel.id}>.`);
                } catch (error) {
                    console.error(error);
                    await interaction.editReply("An error occurred during setup.");
                }
                return;
            }
        }

        // Gestione del Modale dei Commenti
        if (interaction.isModalSubmit() && interaction.customId.startsWith('comment_modal_')) {
            const threadId = interaction.customId.split('_')[2];
            const thread = await interaction.client.channels.fetch(threadId).catch(() => null);
            if (!thread) return interaction.reply({ content: 'Thread non trovato.', flags: ['Ephemeral'] });

            const comment = interaction.fields.getTextInputValue('comment');
            
            const embed = new EmbedBuilder()
                .setDescription(comment)
                .setColor(0x2B2D31)
                .setAuthor({ 
                    name: 'Anonymous Comment',
                    iconURL: interaction.guild.iconURL()
                })
                .setFooter({ 
                    text: `Anonymous Comment • ${new Date().toLocaleString('it-IT')}`
                });
            
            await thread.send({ embeds: [embed] });
            return interaction.reply({ content: '✅ Comment sent.', flags: ['Ephemeral'] });
        }

        // Gestione del Modale delle Confessioni
        if (interaction.isModalSubmit() && interaction.customId.startsWith('confession_modal_')) {
            const channelId = interaction.customId.split('_')[2];
            const confession = interaction.fields.getTextInputValue('confession');
            const channel = await interaction.client.channels.fetch(channelId).catch(() => null);
            if (!channel) return interaction.reply({ content: 'Canale non trovato.', flags: ['Ephemeral'] });
            
            const embed = new EmbedBuilder()
                .setTitle('📨 New Confession')
                .setDescription(confession)
                .setColor(0x2B2D31)
                .setAuthor({ 
                    name: 'Anonymous Confession',
                    iconURL: interaction.guild.iconURL()
                })
                .setFooter({ 
                    text: `Anonymous Confession • ${new Date().toLocaleString('it-IT')}`
                });
            
            const msg = await channel.send({ embeds: [embed] });
            const thread = await msg.startThread({ 
                name: '💬 Confession Comments', 
                autoArchiveDuration: 1440 
            });
            
            const confessionButtons = new ConfessionButtons(channelId, thread.id);
            await msg.edit({ components: confessionButtons.getComponents() });
            
            return interaction.reply({ content: '✅ Confession sent.', flags: ['Ephemeral'] });
        }

        // Gestione del Modale per Rinominare il Canale
        if (interaction.isModalSubmit() && interaction.customId === 'vm_rename_modal') {
            const newName = interaction.fields.getTextInputValue('vm_new_name');
            const voiceChannel = interaction.member.voice.channel;
            if (voiceChannel) {
                await voiceChannel.setName(newName).catch(() => {});
                return interaction.reply({ content: `Channel renamed to **${newName}**`, flags: ['Ephemeral'] });
            }
            return interaction.reply({ content: "You are not in a voice channel.", flags: ['Ephemeral'] });
        }

        if (!interaction.isButton()) return;

        // Gestione Bottoni Pagine Aiuto
        if (interaction.customId.startsWith('help_page_')) {
            const parts = interaction.customId.split('_');
            const page = parseInt(parts[2], 10);
            const userId = parts[3];

            if (interaction.user.id !== userId) {
                return interaction.reply({ content: '❌ Questo menu aiuto non è per te!', flags: ['Ephemeral'] });
            }

            const { getHelpPage } = require('../help');
            const isAdmin = interaction.member.permissions.has(PermissionsBitField.Flags.Administrator) || ALLOWED_USER_IDS.includes(interaction.user.id);
            
            const helpPayload = getHelpPage(page, userId, isAdmin);
            await interaction.update(helpPayload);
            return;
        }

        // Gestione Bottoni Confession
        if (interaction.customId.startsWith('start_confess_')) {
            const channelId = interaction.customId.split('_')[2];
            const modal = new ConfessionModal(channelId);
            return interaction.showModal(modal).catch(console.error);
        }

        if (interaction.customId.startsWith('comment_')) {
            const parts = interaction.customId.split('_');
            const threadId = parts[2];
            const thread = await interaction.client.channels.fetch(threadId).catch(() => null);
            if (thread) {
                const modal = new CommentModal(thread);
                return interaction.showModal(modal).catch(console.error);
            }
            return interaction.reply({ content: 'Thread non trovato.', flags: ['Ephemeral'] });
        }

        if (interaction.customId.startsWith('confess_') && !interaction.customId.startsWith('confession_')) {
            const channelId = interaction.customId.split('_')[1];
            const modal = new ConfessionModal(channelId);
            return interaction.showModal(modal).catch(console.error);
        }

        if (interaction.customId === 'setup_auto') {
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) return interaction.reply({ content: 'You do not have permission.', flags: ['Ephemeral'] });
            await interaction.deferReply({ flags: ['Ephemeral'] });
            await interaction.message.delete().catch(() => {});
            try {
                const category = await interaction.guild.channels.create({ name: 'Voice Channels', type: ChannelType.GuildCategory });
                const textChannel = await interaction.guild.channels.create({ name: 'cmd', type: ChannelType.GuildText, parent: category.id });
                const joinChannel = await interaction.guild.channels.create({ name: 'Join to Create', type: ChannelType.GuildVoice, parent: category.id });
                db.setups[interaction.guild.id] = { categoryId: category.id, joinChannelId: joinChannel.id, textChannelId: textChannel.id };
                saveDB();
                
                const interfaceMsg = getInterfaceMessage(interaction.guild);
                await textChannel.send(interfaceMsg);
                await interaction.editReply(`Automatic setup completed. Interface created in <#${textChannel.id}>.`);
            } catch (error) {
                console.error(error);
                await interaction.editReply("An error occurred during setup. Check permissions.");
            }
            return;
        }

        if (interaction.customId === 'setup_manual') {
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) return interaction.reply({ content: 'You do not have permission.', flags: ['Ephemeral'] });
            
            const catRow = new ActionRowBuilder().addComponents(
                new ChannelSelectMenuBuilder()
                    .setCustomId('setup_select_cat')
                    .setPlaceholder('Select Category')
                    .addChannelTypes(ChannelType.GuildCategory)
            );
            await interaction.reply({ content: 'Select the category for temporary channels:', components: [catRow], flags: ['Ephemeral'] });
            await interaction.message.delete().catch(() => {});
            return;
        }

        if (interaction.customId.startsWith('vm_')) {
            const setup = db.setups[interaction.guild.id];
            if (!setup) return interaction.reply({ content: "Setup not found.", flags: ['Ephemeral'] });

            const voiceChannel = interaction.member.voice.channel;
            if (!voiceChannel || voiceChannel.parentId !== setup.categoryId) {
                return interaction.reply({ content: "You must be in a temporary channel to use these buttons.", flags: ['Ephemeral'] });
            }

            // Verifica se l'utente è il proprietario (ha i permessi ManageChannels sul canale vocale)
            const isOwner = voiceChannel.permissionsFor(interaction.member).has(PermissionsBitField.Flags.ManageChannels);
            
            // Il Claim è l'unica azione che si fa quando NON si è proprietari (o per rubarlo se il proprietario è uscito)
            if (interaction.customId === 'vm_claim') {
                const membersWithPerms = voiceChannel.members.filter(m => voiceChannel.permissionsFor(m).has(PermissionsBitField.Flags.ManageChannels));
                if (membersWithPerms.size > 0 && !membersWithPerms.has(interaction.member.id)) {
                    return interaction.reply({ content: "The channel owner is still present.", flags: ['Ephemeral'] });
                }
                // Rivendica il canale
                await voiceChannel.permissionOverwrites.edit(interaction.member.id, { ManageChannels: true, ManageRoles: true });
                await voiceChannel.setName(`${interaction.user.username}'s channel`).catch(() => {});
                await logToChannel(interaction.guild, "Channel Claimed", `**New Owner:** ${interaction.member}\n**Channel:** ${voiceChannel}`);
                return interaction.reply({ content: `${getStr(emojis.claim, '👑')} You have claimed the channel.`, flags: ['Ephemeral'] });
            }

            // Per tutti gli altri bottoni devi essere il proprietario
            if (!isOwner) {
                return interaction.reply({ content: "Only the channel owner can use these buttons.", flags: ['Ephemeral'] });
            }

            switch (interaction.customId) {
                case 'vm_lock':
                    await voiceChannel.permissionOverwrites.edit(interaction.guild.id, { Connect: false });
                    for (const member of voiceChannel.members.values()) {
                        await voiceChannel.permissionOverwrites.edit(member.id, { SendMessages: true, Connect: true, ViewChannel: true }).catch(() => {});
                    }
                    await interaction.reply({ content: `${getStr(emojis.lock, '🔒')} Channel locked.`, flags: ['Ephemeral'] });
                    break;

                case 'vm_unlock':
                    await voiceChannel.permissionOverwrites.edit(interaction.guild.id, { Connect: null });
                    await interaction.reply({ content: `${getStr(emojis.unlock, '🔓')} Channel unlocked.`, flags: ['Ephemeral'] });
                    break;

                case 'vm_ghost':
                    await voiceChannel.permissionOverwrites.edit(interaction.guild.id, { ViewChannel: false });
                    await interaction.reply({ content: `${getStr(emojis.ghost, '👻')} Channel hidden.`, flags: ['Ephemeral'] });
                    break;

                case 'vm_reveal':
                    await voiceChannel.permissionOverwrites.edit(interaction.guild.id, { ViewChannel: null });
                    await interaction.reply({ content: `${getStr(emojis.reveal, '👁️')} Channel revealed.`, flags: ['Ephemeral'] });
                    break;

                case 'vm_plus':
                    const newLimitPlus = (voiceChannel.userLimit || 0) + 1;
                    if (newLimitPlus > 99) return interaction.reply({ content: "Maximum limit reached (99).", flags: ['Ephemeral'] });
                    await voiceChannel.setUserLimit(newLimitPlus);
                    await interaction.reply({ content: `${getStr(emojis.increase, '➕')} User limit increased to **${newLimitPlus}**.`, flags: ['Ephemeral'] });
                    break;

                case 'vm_minus':
                    const newLimitMinus = (voiceChannel.userLimit || 0) - 1;
                    if (newLimitMinus < 0) return interaction.reply({ content: "Limit cannot be below 0.", flags: ['Ephemeral'] });
                    await voiceChannel.setUserLimit(newLimitMinus);
                    await interaction.reply({ content: `${getStr(emojis.decrease, '➖')} User limit decreased to **${newLimitMinus === 0 ? "unlimited" : newLimitMinus}**.`, flags: ['Ephemeral'] });
                    break;

                case 'vm_delete':
                    await interaction.reply({ content: `${getStr(emojis.delete, '🗑️')} Deleting channel...`, flags: ['Ephemeral'] });
                    await voiceChannel.delete().catch(() => {});
                    break;

                case 'vm_info':
                    const infoEmbed = new EmbedBuilder()
                        .setTitle(`${getStr(emojis.info, 'ℹ️')} Channel Information`)
                        .setColor('#DCE2F0')
                        .addFields(
                            { name: 'Owner', value: `<@${interaction.user.id}>`, inline: true },
                            { name: 'Name', value: voiceChannel.name, inline: true },
                            { name: 'Connected Users', value: `${voiceChannel.members.size}/${voiceChannel.userLimit === 0 ? '∞' : voiceChannel.userLimit}`, inline: true }
                        );
                    await interaction.reply({ embeds: [infoEmbed], flags: ['Ephemeral'] });
                    break;

                case 'vm_rename':
                    const modal = new ModalBuilder()
                        .setCustomId('vm_rename_modal')
                        .setTitle('Rename Channel');

                    const nameInput = new TextInputBuilder()
                        .setCustomId('vm_new_name')
                        .setLabel("What will be the new name?")
                        .setStyle(TextInputStyle.Short)
                        .setMaxLength(100)
                        .setRequired(true);

                    const firstActionRow = new ActionRowBuilder().addComponents(nameInput);
                    modal.addComponents(firstActionRow);
                    await interaction.showModal(modal);
                    break;
            }
        }

        // --- Gestione Pulsanti Ticket ---
        if (interaction.customId === 'ticket_open') {
            const setup = db.setups[interaction.guild.id];
            if (!setup || !setup.ticketCategoryId) {
                return interaction.reply({ content: "Ticket system not fully configured.", flags: ['Ephemeral'] });
            }

            await interaction.deferReply({ flags: ['Ephemeral'] });

            const category = interaction.guild.channels.cache.get(setup.ticketCategoryId) || await interaction.guild.channels.fetch(setup.ticketCategoryId).catch(() => null);
            if (!category) {
                return interaction.editReply("Ticket category not found.");
            }

            const staffRoleId = '1508148694242033904';
            const ticketName = `ticket-${interaction.user.username}`;

            try {
                const ticketChannel = await interaction.guild.channels.create({
                    name: ticketName,
                    type: ChannelType.GuildText,
                    parent: category.id,
                    permissionOverwrites: [
                        {
                            id: interaction.guild.id,
                            deny: [PermissionsBitField.Flags.ViewChannel],
                        },
                        {
                            id: interaction.user.id,
                            allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory],
                        },
                        {
                            id: staffRoleId,
                            allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory],
                        }
                    ]
                });

                const embed = new EmbedBuilder()
                    .setTitle(`Ticket: ${interaction.user.tag}`)
                    .setDescription(`Welcome ${interaction.user}! A staff member <@&${staffRoleId}> will be with you shortly.\n\nTo close this ticket, click the button below.`)
                    .setColor('#5865F2');

                const emojiLock = interaction.guild?.emojis.cache.find(e => e.name === 'vm_lock');
                const btnClose = new ButtonBuilder()
                    .setCustomId('ticket_close')
                    .setLabel('Close Ticket')
                    .setStyle(ButtonStyle.Danger);
                if (emojiLock) btnClose.setEmoji(emojiLock.id);
                else btnClose.setEmoji('🔒');

                const row = new ActionRowBuilder().addComponents(btnClose);

                await ticketChannel.send({ content: `${interaction.user} <@&${staffRoleId}>`, embeds: [embed], components: [row] });
                await interaction.editReply(`✅ Ticket created: <#${ticketChannel.id}>`);
            } catch (error) {
                console.error(error);
                await interaction.editReply("Failed to create ticket.");
            }
        }

        if (interaction.customId === 'ticket_close') {
            await interaction.deferReply();
            const setup = db.setups[interaction.guild.id];
            
            try {
                const discordHtmlTranscripts = require('discord-html-transcripts');
                const transcript = await discordHtmlTranscripts.createTranscript(interaction.channel, {
                    limit: -1,
                    returnType: 'attachment',
                    filename: `transcript-${interaction.channel.name}.html`,
                    saveImages: true,
                    poweredBy: false
                });

                // Send to user
                await interaction.user.send({
                    content: `Your ticket **${interaction.channel.name}** has been closed. Here is the transcript:`,
                    files: [transcript]
                }).catch(() => console.log('Could not send DM to user.'));

                // Send to log channel if configured
                if (setup && setup.ticketLogChannelId) {
                    const logChannel = interaction.guild.channels.cache.get(setup.ticketLogChannelId) || await interaction.guild.channels.fetch(setup.ticketLogChannelId).catch(() => null);
                    if (logChannel) {
                        const embed = new EmbedBuilder()
                            .setTitle('Ticket Closed')
                            .setDescription(`Ticket: ${interaction.channel.name}\nClosed by: ${interaction.user}`)
                            .setColor('#ED4245')
                            .setTimestamp();
                        await logChannel.send({ embeds: [embed], files: [transcript] }).catch(() => {});
                    }
                }

                await interaction.editReply("Transcript saved! Deleting channel in 5 seconds...");
                setTimeout(() => {
                    interaction.channel.delete().catch(() => {});
                }, 5000);
            } catch (error) {
                console.error(error);
                await interaction.editReply("Failed to close ticket and generate transcript.");
            }
        }
    }
};
