const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

function getHelpPage(page, userId, isAdmin) {
    const colors = {
        1: '#A370F7', // Voice
        2: '#5865F2', // Music
        3: '#ED4245'  // Admin
    };

    let title = '';
    let description = '';
    let fields = [];

    if (page === 1) {
        title = '🔊 Voice Help';
        description = 'Control your temporary voice channels.';
        fields = [
            {
                name: 'Voice Channel Controls',
                value: [
                    '**!lock** - Lock channel to prevent anyone from joining',
                    '**!unlock** - Unlock channel so anyone can join',
                    '**!ghost** - Hide channel from the channel list',
                    '**!reveal** - Reveal channel to everyone',
                    '**!rename <name>** - Rename your voice channel',
                    '**!kick @user** - Disconnect a user and lock them out',
                    '**!add @user** - Whitelist a user to join your channel',
                    '**!trust @user** - Add user to your personal whitelist'
                ].join('\n')
            }
        ];
    } else if (page === 2) {
        title = '🎵 Music System Help';
        description = 'Control high-fidelity music playback in your voice channels.';
        fields = [
            {
                name: 'Playback Commands',
                value: [
                    '**/play <song/link>** - Play a song from Spotify/YouTube',
                    '**/skip** - Skip the current song',
                    '**/stop** - Stop music playback and disconnect',
                    '**/pause** - Pause current track playback',
                    '**/resume** - Resume paused track',
                    '**/nowplaying** - Show progress bar & track metadata',
                    '**/seek <seconds>** - Jump to a specific second'
                ].join('\n')
            },
            {
                name: 'Queue Management',
                value: [
                    '**/queue** - View list of upcoming songs',
                    '**/volume <0-100>** - Adjust sound volume',
                    '**/loop <off|track|queue>** - Choose loop mode',
                    '**/shuffle** - Randomize queue order',
                    '**/remove <number>** - Remove a track from queue',
                    '**/clear** - Wipe entire song queue',
                    '**/autoplay** - Auto-play related tracks when queue ends'
                ].join('\n')
            }
        ];
    } else if (page === 3) {
        title = '🛡️ Server Management Help (Admin Only)';
        description = 'Administrative commands to configure, manage, and monitor the bot.';
        fields = [
            {
                name: 'Confession System',
                value: [
                    '**/confess** - Send an anonymous confession',
                    '**/setupconfession #channel** - Setup confession panel in a text channel'
                ].join('\n')
            },
            {
                name: 'Counting System',
                value: [
                    '**/setupcounting #channel** - Setup counting game channel',
                    '**/counting stats** - Show counting statistics and leaderboard',
                    '**/counting reset** - Reset the counting game',
                    '**/counting set <number>** - Set current counting number'
                ].join('\n')
            },
            {
                name: 'VoiceMaster Setup',
                value: [
                    '**/vc-setup** - Interactive category wizard setup',
                    '**/vc-remove** - Safely delete all temporary voice assets',
                    '**/reload** - Wipes and recreates entire setups',
                    '**/emoji-setup** - Auto-upload all premium UI custom emojis to the server'
                ].join('\n')
            },
            {
                name: 'Utility & Tools',
                value: [
                    '**/status** - View bot statistics, CPU, RAM & uptime',
                    '**/dm <@user> <message>** - Send private message from bot',
                    '**/purge <amount>** - Purge chat messages'
                ].join('\n')
            }
        ];
    }

    const embed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(description)
        .setColor(colors[page] || '#DCE2F0')
        .addFields(fields)
        .setFooter({ text: `Page ${page} of ${isAdmin ? 3 : 2}` })
        .setTimestamp();

    const row = new ActionRowBuilder();
    row.addComponents(
        new ButtonBuilder()
            .setCustomId(`help_page_1_${userId}`)
            .setLabel('🔊 Voice Controls')
            .setStyle(page === 1 ? ButtonStyle.Primary : ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId(`help_page_2_${userId}`)
            .setLabel('🎵 Music Controls')
            .setStyle(page === 2 ? ButtonStyle.Primary : ButtonStyle.Secondary)
    );

    if (isAdmin) {
        row.addComponents(
            new ButtonBuilder()
                .setCustomId(`help_page_3_${userId}`)
                .setLabel('🛡️ Server Admin')
                .setStyle(page === 3 ? ButtonStyle.Primary : ButtonStyle.Secondary)
        );
    }

    return { embeds: [embed], components: [row] };
}

module.exports = { getHelpPage };
