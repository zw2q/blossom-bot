const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField, ChannelType } = require('discord.js');
const { QueueRepeatMode } = require('discord-player');
const { db, saveDB, logToChannel } = require('../db');
const { getInterfaceMessage } = require('../ui');
const { StartView } = require('../confessions');
const ALLOWED_USER_IDS = ['1364624416532725861', '243748917311700992'];

module.exports = {
    name: 'messageCreate',
    async execute(message, client) {
        if (message.author.bot) return;

        const args = message.content.trim().split(/ +/);
        const command = args.shift().toLowerCase();

        const emojis = {
            lock: message.guild.emojis.cache.find(e => e.name === 'vm_lock'),
            unlock: message.guild.emojis.cache.find(e => e.name === 'vm_unlock'),
            ghost: message.guild.emojis.cache.find(e => e.name === 'vm_ghost'),
            reveal: message.guild.emojis.cache.find(e => e.name === 'vm_reveal'),
            rename: message.guild.emojis.cache.find(e => e.name === 'vm_rename'),
            claim: message.guild.emojis.cache.find(e => e.name === 'vm_claim'),
            increase: message.guild.emojis.cache.find(e => e.name === 'vm_increase'),
            decrease: message.guild.emojis.cache.find(e => e.name === 'vm_decrease'),
            delete: message.guild.emojis.cache.find(e => e.name === 'vm_delete'),
            info: message.guild.emojis.cache.find(e => e.name === 'vm_info'),
            add: message.guild.emojis.cache.find(e => e.name === 'vm_add')
        };
        const getStr = (em, fallback) => em ? `<:${em.name}:${em.id}>` : fallback;

        // Comando: !vc setup
        if (command === '!vc' && args[0]?.toLowerCase() === 'setup') {
            if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                return message.reply({ content: "You do not have permission to use this command." });
            }

            const setupEmbed = new EmbedBuilder()
                .setTitle('VoiceMaster Setup')
                .setDescription('Choose how you want to configure VoiceMaster:\n\n**Automatic Setup**: Create everything from scratch (Category, Text Channel, Voice Channel).\n**Manual Setup**: Use an existing category and voice channel.')
                .setColor('#DCE2F0');

            const setupRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('setup_auto').setLabel('Automatic Setup').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('setup_manual').setLabel('Manual Setup').setStyle(ButtonStyle.Secondary)
            );

            await message.reply({ embeds: [setupEmbed], components: [setupRow] });
            return;
        }

        // Comando: !vc remove
        if (command === '!vc' && args[0]?.toLowerCase() === 'remove') {
            if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                return message.reply({ content: "You do not have permission to use this command." });
            }

            const setup = db.setups[message.guild.id];
            if (!setup) return message.reply({ content: "No active setup found in this server." });

            try {
                await message.reply("Removing setup...");
                const category = message.guild.channels.cache.get(setup.categoryId) || await message.guild.channels.fetch(setup.categoryId).catch(() => null);
                if (category) {
                    const children = category.children.cache;
                    for (const [id, channel] of children) {
                        await channel.delete().catch(() => { });
                    }
                    await category.delete().catch(() => { });
                }
                delete db.setups[message.guild.id];
                saveDB();
                if (message.channel) await message.channel.send("VoiceMaster setup removed successfully.").catch(() => {});
            } catch (error) {
                console.error(error);
                if (message.channel) await message.channel.send("An error occurred while removing the setup.").catch(() => {});
            }
            return;
        }

        // Comando: !log setup
        if (command === '!log' && args[0]?.toLowerCase() === 'setup') {
            if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                return message.reply({ content: "You do not have permission to use this command." });
            }

            try {
                await message.reply("Setting up logs...");
                const logCategory = await message.guild.channels.create({ name: 'Logs', type: ChannelType.GuildCategory });
                const logChannel = await message.guild.channels.create({
                    name: 'server-logs',
                    type: ChannelType.GuildText,
                    parent: logCategory.id,
                    permissionOverwrites: [
                        {
                            id: message.guild.id,
                            deny: [PermissionsBitField.Flags.ViewChannel]
                        }
                    ]
                });

                if (!db.setups[message.guild.id]) db.setups[message.guild.id] = {};
                db.setups[message.guild.id].logChannelId = logChannel.id;
                saveDB();

                const logEmbed = new EmbedBuilder()
                    .setTitle("🟢 Log bot is now active")
                    .setDescription(`**Bot:** ${message.client.user}\n**Servers:** ${message.client.guilds.cache.size}\n\n**Features active:**\n• ✅ Deleted messages (with media)\n• ✅ Edited messages\n• ✅ Voice channel events\n• ✅ Profile changes\n• ✅ Nickname changes\n• ✅ Member join/leave\n• ✅ Ban/Kick logs\n• ✅ Channel create/delete/edit\n• ✅ Role changes\n• ✅ Bulk message delete\n• ✅ Thread events`)
                    .setColor('#2ECC71')
                    .setTimestamp();
                await logChannel.send({ embeds: [logEmbed] }).catch(() => {});

                await message.channel.send("Logs setup completed.");
            } catch (error) {
                console.error(error);
                await message.channel.send("An error occurred during log setup.");
            }
            return;
        }

        // Comando: !log remove
        if (command === '!log' && args[0]?.toLowerCase() === 'remove') {
            if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                return message.reply({ content: "You do not have permission to use this command." });
            }

            const setup = db.setups[message.guild.id];
            if (!setup || !setup.logChannelId) return message.reply({ content: "No log setup found." });

            try {
                await message.reply("Removing logs setup...");
                const logChannel = message.guild.channels.cache.get(setup.logChannelId) || await message.guild.channels.fetch(setup.logChannelId).catch(() => null);
                if (logChannel) {
                    const logCat = logChannel.parent;
                    await logChannel.delete().catch(() => { });
                    if (logCat && logCat.children.cache.size === 0) await logCat.delete().catch(() => { });
                }
                delete db.setups[message.guild.id].logChannelId;
                saveDB();
                if (message.channel) await message.channel.send("Logs setup removed.").catch(() => {});
            } catch (error) {
                console.error(error);
                if (message.channel) await message.channel.send("An error occurred while removing the log setup.").catch(() => {});
            }
            return;
        }

        // Comando: !emoji setup
        if (command === '!emoji' && args[0]?.toLowerCase() === 'setup') {
            if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                return message.reply({ content: "You do not have permission to use this command." });
            }

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

            await message.reply("🔄 Setting up emojis... This might take a moment as it removes old emojis and uploads new ones.");
            
            let uploaded = 0;
            for (const em of emojisToUpload) {
                try {
                    const existing = message.guild.emojis.cache.find(e => e.name === em.name);
                    if (existing) {
                        await existing.delete();
                    }
                    await message.guild.emojis.create({ attachment: em.url, name: em.name });
                    uploaded++;
                } catch (err) {
                    console.error(`Error with emoji ${em.name}:`, err);
                }
            }
            
            await message.channel.send(`✅ Successfully uploaded/updated **${uploaded}** emojis. You can now run \`!reload\` if you want to update the panels.`);
            return;
        }

        // Comando: !global setup
        if (command === '!global' && args[0]?.toLowerCase() === 'setup') {
            if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                return message.reply({ content: "You do not have permission to use this command." });
            }
            await message.reply("Setting up VoiceMaster AND Logs automatically...");

            try {
                const category = await message.guild.channels.create({ name: 'Voice Channels', type: ChannelType.GuildCategory });
                const textChannel = await message.guild.channels.create({ name: 'cmd', type: ChannelType.GuildText, parent: category.id });
                const joinChannel = await message.guild.channels.create({ name: 'Join to Create', type: ChannelType.GuildVoice, parent: category.id });

                const logCategory = await message.guild.channels.create({ name: 'Logs', type: ChannelType.GuildCategory });
                const logChannel = await message.guild.channels.create({
                    name: 'server-logs',
                    type: ChannelType.GuildText,
                    parent: logCategory.id,
                    permissionOverwrites: [{ id: message.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] }]
                });

                db.setups[message.guild.id] = {
                    categoryId: category.id,
                    joinChannelId: joinChannel.id,
                    textChannelId: textChannel.id,
                    logChannelId: logChannel.id
                };
                saveDB();

                const logEmbed = new EmbedBuilder()
                    .setTitle("🟢 Log bot is now active")
                    .setDescription(`**Bot:** ${message.client.user}\n**Servers:** ${message.client.guilds.cache.size}\n\n**Features active:**\n• ✅ Deleted messages (with media)\n• ✅ Edited messages\n• ✅ Voice channel events\n• ✅ Profile changes\n• ✅ Nickname changes\n• ✅ Member join/leave\n• ✅ Ban/Kick logs\n• ✅ Channel create/delete/edit\n• ✅ Role changes\n• ✅ Bulk message delete\n• ✅ Thread events`)
                    .setColor('#2ECC71')
                    .setTimestamp();
                await logChannel.send({ embeds: [logEmbed] }).catch(() => {});

                const interfaceMsg = getInterfaceMessage(message.guild);
                await textChannel.send(interfaceMsg);
                await message.channel.send(`Global setup completed. Interface created in <#${textChannel.id}> and logs in <#${logChannel.id}>.`);
            } catch (error) {
                console.error(error);
                await message.channel.send("An error occurred during global setup.");
            }
            return;
        }

        // Comando: !reload
        if (command === '!reload') {
            if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                return message.reply({ content: "You do not have permission to use this command." });
            }

            const setup = db.setups[message.guild.id];
            if (!setup) return message.reply({ content: "No active setup found to reload." });

            try {
                await message.reply("Reloading setup (deleting old channels and recreating them)...");

                // Delete old voice category
                const category = message.guild.channels.cache.get(setup.categoryId) || await message.guild.channels.fetch(setup.categoryId).catch(() => null);
                if (category) {
                    const children = category.children.cache;
                    for (const [id, channel] of children) {
                        await channel.delete().catch(() => { });
                    }
                    await category.delete().catch(() => { });
                }
                // Delete old log channel
                if (setup.logChannelId) {
                    const logChannel = message.guild.channels.cache.get(setup.logChannelId) || await message.guild.channels.fetch(setup.logChannelId).catch(() => null);
                    if (logChannel) {
                        const logCat = logChannel.parent;
                        await logChannel.delete().catch(() => { });
                        if (logCat && logCat.children.cache.size === 0) await logCat.delete().catch(() => { });
                    }
                }
                delete db.setups[message.guild.id];

                // Recreate new setup
                const newCategory = await message.guild.channels.create({ name: 'Voice Channels', type: ChannelType.GuildCategory });
                const textChannel = await message.guild.channels.create({ name: 'cmd', type: ChannelType.GuildText, parent: newCategory.id });
                const joinChannel = await message.guild.channels.create({ name: 'Join to Create', type: ChannelType.GuildVoice, parent: newCategory.id });

                const logCategory = await message.guild.channels.create({ name: 'Logs', type: ChannelType.GuildCategory });
                const logChannel = await message.guild.channels.create({
                    name: 'vc-logs',
                    type: ChannelType.GuildText,
                    parent: logCategory.id,
                    permissionOverwrites: [{ id: message.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] }]
                });

                db.setups[message.guild.id] = {
                    categoryId: newCategory.id,
                    joinChannelId: joinChannel.id,
                    textChannelId: textChannel.id,
                    logChannelId: logChannel.id
                };
                saveDB();

                const interfaceMsg = getInterfaceMessage(message.guild);
                await textChannel.send(interfaceMsg);
                if (message.channel) await message.channel.send(`Reload completed. New interface created in <#${textChannel.id}>.`).catch(() => {});
            } catch (error) {
                console.error(error);
                if (message.channel) await message.channel.send("An error occurred during reload.").catch(() => {});
            }
            return;
        }

        // Comando: !status
        if (command === '!status') {
            const guild = message.guild;
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
                .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
                .setTimestamp();
            await message.reply({ embeds: [embed] });
            return;
        }

        // Comando: !help
        if (command === '!help') {
            const { getHelpPage } = require('../help');
            const isAdmin = message.member.permissions.has(PermissionsBitField.Flags.Administrator) || ALLOWED_USER_IDS.includes(message.author.id);
            const helpPayload = getHelpPage(1, message.author.id, isAdmin);
            await message.reply(helpPayload);
            return;
        }

        // Confessions Commands
        if (command === '!dm') {
            if (!ALLOWED_USER_IDS.includes(message.author.id) && !message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                return message.reply("❌ You are not authorized to use this command.");
            }
            const targetId = args[0]?.replace(/[<@!>]/g, '');
            const msgContent = args.slice(1).join(' ');
            if (!targetId || !msgContent) return message.reply("Usage: `!dm @user message`");

            try {
                const target = await client.users.fetch(targetId);
                await target.send(msgContent);
                await message.reply(`✅ Sent to ${target.displayName || target.username}`);
            } catch (error) {
                await message.reply('❌ DMs closed or user not found');
            }
            return;
        }

        if (command === '!clear') {
            if (!ALLOWED_USER_IDS.includes(message.author.id) && !message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                return message.reply("❌ You are not authorized to use this command.");
            }
            const amount = parseInt(args[0], 10);
            if (isNaN(amount) || amount < 1 || amount > 100) return message.reply("❌ Use 1-100");

            await message.channel.bulkDelete(amount, true).then(deleted => {
                message.channel.send(`✅ Deleted ${deleted.size} messages`).then(m => setTimeout(() => m.delete().catch(() => { }), 3000));
            }).catch(e => {
                message.reply("❌ Error deleting messages.");
            });
            return;
        }

        if (command === '!setupconfession') {
            if (!ALLOWED_USER_IDS.includes(message.author.id) && !message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                return message.reply("❌ You are not authorized to use this command.");
            }

            const embed = new EmbedBuilder()
                .setTitle('✉️ Anonymous Confessions')
                .setDescription('Click the button below to send a confession')
                .setColor(0x2B2D31);

            const confessionChannelId = process.env.CONFESSION_CHANNEL_ID || message.channel.id;
            const startView = new StartView(confessionChannelId);

            await message.channel.send({ embeds: [embed], components: startView.getComponents() });
            await message.delete().catch(() => { });
            return;
        }

        // Comandi Musica
        const musicCommands = [
            '!play', '!stop', '!skip', '!pause', '!resume', '!nowplaying', '!np',
            '!volume', '!loop', '!shuffle', '!remove', '!clear', '!queue', '!q', '!autoplay', '!seek'
        ];

        if (musicCommands.includes(command)) {
            const voiceChannel = message.member.voice.channel;
            
            // Check play permissions and voice state first for '!play'
            if (command === '!play') {
                console.log("[1] Command received");
                if (!voiceChannel) {
                    const embed = new EmbedBuilder()
                        .setColor('#ED4245')
                        .setDescription('❌ You need to be in a voice channel to play music!');
                    return message.reply({ embeds: [embed] });
                }

                console.log("[2] User in VC");
                const query = args.join(" ");
                if (!query) {
                    const embed = new EmbedBuilder()
                        .setColor('#A370F7')
                        .setTitle('🎵 How to use !play')
                        .setDescription('Provide a song name, YouTube link, or Spotify link (Track, Playlist, Album).\n\n**Examples:**\n• `!play Eminem Mockingbird`\n• `!play https://open.spotify.com/track/xxxx`\n• `!play https://www.youtube.com/watch?v=xxxx`');
                    return message.reply({ embeds: [embed] });
                }

                const searchEmbed = new EmbedBuilder()
                    .setColor('#5865F2')
                    .setDescription(`🔍 Searching and extracting **${query}**...`);
                const replyMsg = await message.reply({ embeds: [searchEmbed] });

                console.log("[3] Joining VC");
                try {
                    const { track } = await client.player.play(voiceChannel, query, {
                        nodeOptions: {
                            metadata: message,
                            leaveOnEmpty: true,
                            leaveOnEmptyCooldown: 30000,
                            leaveOnEnd: true,
                            leaveOnEndCooldown: 30000,
                            async onBeforeCreateStream(track, source, _queue) {
                                console.log(`[MUSIC-DEBUG] onBeforeCreateStream started for: "${track.title}" (Source: ${source})`);
                                try {
                                    const ytdl = require('youtube-dl-exec');
                                    const play = require('play-dl');
                                    const url = track.url || '';
                                    
                                    let targetUrl = '';
                                    
                                    console.log("[5] Searching YouTube");
                                    if (source === 'spotifySong' || source === 'spotifyPlaylist' || source === 'spotifyAlbum' || url.includes('spotify.com')) {
                                        const title = track.title || 'Unknown Title';
                                        const author = track.author || 'Unknown Artist';
                                        console.log(`[MUSIC-DEBUG] Spotify track parsed: "${title}" by "${author}"`);
                                        console.log(`[MUSIC-DEBUG] Searching YouTube for: "${title} ${author}"`);
                                        
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
                                        console.log("[6] YouTube URL:", targetUrl);
                                        console.log("[7] Creating stream");
                                        
                                        // Use the requested play.stream(url) flow from play-dl
                                        const stream = await play.stream(targetUrl);
                                        
                                        if (stream && stream.stream) {
                                            console.log("[8] Stream created");
                                            console.log("[9] Creating resource");
                                            console.log("[10] Resource created");
                                            return { stream: stream.stream, type: stream.type };
                                        }
                                    }
                                } catch (err) {
                                    console.error('[MUSIC-DEBUG] Error inside onBeforeCreateStream:', err);
                                }
                                console.log(`[MUSIC-DEBUG] Falling back to default extractor.`);
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
                            { name: '🎧 Requested By', value: `${message.author}`, inline: true }
                        )
                        .setThumbnail(track.thumbnail || null);
                    
                    await replyMsg.edit({ embeds: [playEmbed] });
                } catch (e) {
                    console.error(e);
                    const errorEmbed = new EmbedBuilder()
                        .setColor('#ED4245')
                        .setDescription('❌ Failed to play the track. Make sure you provided a valid query/link.');
                    await replyMsg.edit({ embeds: [errorEmbed] });
                }
                return;
            }

            // Get active queue for other commands
            const queue = client.player.nodes.get(message.guild.id);
            if (!queue || !queue.isPlaying()) {
                const embed = new EmbedBuilder()
                    .setColor('#ED4245')
                    .setDescription('❌ No music is currently playing in this server!');
                return message.reply({ embeds: [embed] });
            }

            if (command === '!stop') {
                queue.delete();
                const embed = new EmbedBuilder()
                    .setColor('#ED4245')
                    .setDescription('🛑 Music playback stopped and bot left the voice channel.');
                return message.reply({ embeds: [embed] });
            }

            if (command === '!skip') {
                queue.node.skip();
                const embed = new EmbedBuilder()
                    .setColor('#57F287')
                    .setDescription('⏭️ Skipped current track.');
                return message.reply({ embeds: [embed] });
            }

            if (command === '!pause') {
                queue.node.setPaused(true);
                const embed = new EmbedBuilder()
                    .setColor('#A370F7')
                    .setDescription('⏸️ Paused the music.');
                return message.reply({ embeds: [embed] });
            }

            if (command === '!resume') {
                queue.node.setPaused(false);
                const embed = new EmbedBuilder()
                    .setColor('#57F287')
                    .setDescription('▶️ Resumed music playback.');
                return message.reply({ embeds: [embed] });
            }

            if (command === '!nowplaying' || command === '!np') {
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
                return message.reply({ embeds: [embed] });
            }

            if (command === '!volume') {
                const vol = parseInt(args[0], 10);
                if (isNaN(vol) || vol < 0 || vol > 100) {
                    const embed = new EmbedBuilder()
                        .setColor('#ED4245')
                        .setDescription('❌ Provide a volume level between `0` and `100`.');
                    return message.reply({ embeds: [embed] });
                }
                queue.node.setVolume(vol);
                const embed = new EmbedBuilder()
                    .setColor('#57F287')
                    .setDescription(`🔊 Volume updated to **${vol}%**.`);
                return message.reply({ embeds: [embed] });
            }

            if (command === '!loop') {
                const currentMode = queue.repeatMode;
                let nextMode = QueueRepeatMode.OFF;
                let replyStr = "Loop mode turned **OFF**.";
                
                if (currentMode === QueueRepeatMode.OFF) {
                    nextMode = QueueRepeatMode.TRACK;
                    replyStr = "Looping current **TRACK**.";
                } else if (currentMode === QueueRepeatMode.TRACK) {
                    nextMode = QueueRepeatMode.QUEUE;
                    replyStr = "Looping entire **QUEUE**.";
                }
                
                queue.setRepeatMode(nextMode);
                const embed = new EmbedBuilder()
                    .setColor('#A370F7')
                    .setDescription(`🔁 ${replyStr}`);
                return message.reply({ embeds: [embed] });
            }

            if (command === '!shuffle') {
                queue.tracks.shuffle();
                const embed = new EmbedBuilder()
                    .setColor('#57F287')
                    .setDescription('🔀 Queue successfully shuffled!');
                return message.reply({ embeds: [embed] });
            }

            if (command === '!remove') {
                const index = parseInt(args[0], 10);
                if (isNaN(index) || index < 1 || index > queue.tracks.size) {
                    const embed = new EmbedBuilder()
                        .setColor('#ED4245')
                        .setDescription(`❌ Provide a valid track number between \`1\` and \`${queue.tracks.size}\`.`);
                    return message.reply({ embeds: [embed] });
                }
                const removedTrack = queue.node.remove(index - 1);
                const embed = new EmbedBuilder()
                    .setColor('#57F287')
                    .setDescription(`🗑️ Removed **${removedTrack.title}** from the queue.`);
                return message.reply({ embeds: [embed] });
            }

            if (command === '!clear') {
                queue.tracks.clear();
                const embed = new EmbedBuilder()
                    .setColor('#ED4245')
                    .setDescription('🗑️ Queue cleared successfully.');
                return message.reply({ embeds: [embed] });
            }

            if (command === '!queue' || command === '!q') {
                const upcoming = queue.tracks.toArray();
                if (upcoming.length === 0) {
                    const embed = new EmbedBuilder()
                        .setColor('#A370F7')
                        .setTitle('🎵 Server Queue')
                        .setDescription(`**Now Playing:** [${queue.currentTrack.title}](${queue.currentTrack.url})\n\n*No upcoming tracks in queue.*`);
                    return message.reply({ embeds: [embed] });
                }

                const trackList = upcoming.slice(0, 10).map((t, idx) => `**${idx + 1}.** [${t.title}](${t.url}) - \`${t.duration}\``).join('\n');
                const embed = new EmbedBuilder()
                    .setColor('#A370F7')
                    .setTitle('🎵 Server Queue')
                    .setDescription(`**Now Playing:** [${queue.currentTrack.title}](${queue.currentTrack.url})\n\n**Upcoming:**\n${trackList}${upcoming.length > 10 ? `\n\n*...and ${upcoming.length - 10} more tracks*` : ''}`)
                    .setFooter({ text: `${upcoming.length} tracks in queue` });
                return message.reply({ embeds: [embed] });
            }

            if (command === '!autoplay') {
                const nextMode = queue.repeatMode === QueueRepeatMode.AUTOPLAY ? QueueRepeatMode.OFF : QueueRepeatMode.AUTOPLAY;
                queue.setRepeatMode(nextMode);
                const embed = new EmbedBuilder()
                    .setColor('#A370F7')
                    .setDescription(`📻 Autoplay mode has been turned **${nextMode === QueueRepeatMode.AUTOPLAY ? 'ON' : 'OFF'}**.`);
                return message.reply({ embeds: [embed] });
            }

            if (command === '!seek') {
                const time = parseInt(args[0], 10);
                if (isNaN(time)) {
                    const embed = new EmbedBuilder()
                        .setColor('#ED4245')
                        .setDescription('❌ Specify seek time in seconds. Example: `!seek 60`');
                    return message.reply({ embeds: [embed] });
                }
                queue.node.seek(time * 1000);
                const embed = new EmbedBuilder()
                    .setColor('#57F287')
                    .setDescription(`⏩ Seeked to **${time}s**.`);
                return message.reply({ embeds: [embed] });
            }
        }

        // Comandi Vocali Prefix
        const voiceCommands = ['!lock', '!unlock', '!ghost', '!reveal', '!rename', '!kick', '!add', '!trust'];
        if (voiceCommands.includes(command)) {
            const setup = db.setups[message.guild.id];
            if (!setup) return;

            const voiceChannel = message.member.voice.channel;
            if (!voiceChannel || voiceChannel.parentId !== setup.categoryId) {
                return message.reply("You must be in a temporary channel to use this command.");
            }

            const isOwner = voiceChannel.permissionsFor(message.member).has(PermissionsBitField.Flags.ManageChannels);
            if (!isOwner) {
                return message.reply("Only the channel owner can use this command.");
            }

            switch (command) {
                case '!lock':
                    await voiceChannel.permissionOverwrites.edit(message.guild.id, { Connect: false });
                    for (const member of voiceChannel.members.values()) {
                        await voiceChannel.permissionOverwrites.edit(member.id, { SendMessages: true, Connect: true, ViewChannel: true }).catch(() => { });
                    }
                    await message.reply(`${getStr(emojis.lock, '🔒')} Channel locked.`);
                    break;
                case '!unlock':
                    await voiceChannel.permissionOverwrites.edit(message.guild.id, { Connect: null });
                    await message.reply(`${getStr(emojis.unlock, '🔓')} Channel unlocked.`);
                    break;
                case '!ghost':
                    await voiceChannel.permissionOverwrites.edit(message.guild.id, { ViewChannel: false });
                    await message.reply(`${getStr(emojis.ghost, '👻')} Channel hidden.`);
                    break;
                case '!reveal':
                    await voiceChannel.permissionOverwrites.edit(message.guild.id, { ViewChannel: null });
                    await message.reply(`${getStr(emojis.reveal, '👁️')} Channel revealed.`);
                    break;
                case '!rename':
                    const newName = args.join(' ');
                    if (!newName) return message.reply("Please specify a new name. Example: `!rename My Channel`");
                    await voiceChannel.setName(newName);
                    await message.reply(`Channel renamed to **${newName}**`);
                    break;
                case '!kick':
                    const targetKick = message.mentions.members.first();
                    if (!targetKick) return message.reply("Mention the user to kick. Example: `!kick @user`");
                    if (targetKick.voice.channelId !== voiceChannel.id) return message.reply("That user is not in your voice channel.");
                    await voiceChannel.permissionOverwrites.edit(targetKick.id, { Connect: false });
                    await targetKick.voice.disconnect();
                    await message.reply(`${targetKick.user.tag} was disconnected and locked out.`);
                    break;
                case '!add':
                    const targetAdd = message.mentions.members.first();
                    if (!targetAdd) return message.reply("Mention the user to add. Example: `!add @user`");
                    await voiceChannel.permissionOverwrites.edit(targetAdd.id, { Connect: true, SendMessages: true, ViewChannel: true });
                    await message.reply(`${targetAdd.user.tag} has been added to the channel.`);
                    break;
                case '!trust':
                    const trustedUser = message.mentions.users.first();
                    if (!trustedUser) return message.reply("Please mention a user to trust.");
                    if (!db.trusts[message.author.id]) db.trusts[message.author.id] = [];
                    if (!db.trusts[message.author.id].includes(trustedUser.id)) {
                        db.trusts[message.author.id].push(trustedUser.id);
                        saveDB();
                    }
                    await voiceChannel.permissionOverwrites.edit(trustedUser.id, { Connect: true, ViewChannel: true, SendMessages: true }).catch(() => { });
                    await message.reply(`${getStr(emojis.add, '✅')} ${trustedUser} has been added to your whitelist.`);
                    break;
            }
        }
    }
};
