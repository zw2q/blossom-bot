const { ActivityType, ApplicationCommandOptionType } = require('discord.js');

module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        console.log(`[BOT] Logged in as ${client.user.tag}!`);
        client.user.setPresence({
            activities: [{
                name: 'blossom - ella stink so bad',
                type: ActivityType.Streaming,
                url: 'https://www.twitch.tv/lyonwgflive'
            }],
            status: 'online',
        });

        // Define Slash Commands
        const slashCommands = [
            {
                name: 'help',
                description: 'Shows the interactive help menu'
            },
            {
                name: 'status',
                description: 'Shows the server status'
            },
            {
                name: 'emoji-setup',
                description: 'Automatically configures emojis for VoiceMaster'
            },
            {
                name: 'reload',
                description: 'Restarts the server channel configuration'
            },
            {
                name: 'dm',
                description: 'Sends an anonymous private message to a user',
                options: [
                    {
                        name: 'user',
                        description: 'The user to send the message to',
                        type: ApplicationCommandOptionType.User,
                        required: true
                    },
                    {
                        name: 'message',
                        description: 'The message to send',
                        type: ApplicationCommandOptionType.String,
                        required: true
                    }
                ]
            },
            {
                name: 'vc-setup',
                description: 'Starts the VoiceMaster control panel'
            },
            {
                name: 'vc-remove',
                description: 'Removes the VoiceMaster configuration from the server'
            },
            {
                name: 'log-setup',
                description: 'Configures the server logging system'
            },
            {
                name: 'log-remove',
                description: 'Removes the logging configuration from the server'
            },
            {
                name: 'global-setup',
                description: 'Runs the complete automatic setup (VoiceMaster + Logs)'
            },
            {
                name: 'setupconfession',
                description: 'Configures the panel to send anonymous confessions'
            },
            {
                name: 'play',
                description: 'Plays a song or playlist from YouTube/Spotify',
                options: [
                    {
                        name: 'song',
                        description: 'Track name, YouTube link, or Spotify link',
                        type: ApplicationCommandOptionType.String,
                        required: true
                    }
                ]
            },
            {
                name: 'stop',
                description: 'Stops music playback and disconnects the bot'
            },
            {
                name: 'skip',
                description: 'Skips to the next track in the queue'
            },
            {
                name: 'pause',
                description: 'Pauses the music playback'
            },
            {
                name: 'resume',
                description: 'Resumes the music playback'
            },
            {
                name: 'nowplaying',
                description: 'Shows the currently playing track'
            },
            {
                name: 'volume',
                description: 'Adjusts the bot volume',
                options: [
                    {
                        name: 'level',
                        description: 'Volume percentage (0-100)',
                        type: ApplicationCommandOptionType.Integer,
                        required: true,
                        min_value: 0,
                        max_value: 100
                    }
                ]
            },
            {
                name: 'loop',
                description: 'Sets the loop mode',
                options: [
                    {
                        name: 'mode',
                        description: 'Desired loop mode',
                        type: ApplicationCommandOptionType.String,
                        required: true,
                        choices: [
                            { name: 'Off', value: 'off' },
                            { name: 'Track', value: 'track' },
                            { name: 'Queue', value: 'queue' }
                        ]
                    }
                ]
            },
            {
                name: 'shuffle',
                description: 'Shuffles the tracks in the queue'
            },
            {
                name: 'remove',
                description: 'Removes a specific track from the queue',
                options: [
                    {
                        name: 'index',
                        description: 'Track position in the queue',
                        type: ApplicationCommandOptionType.Integer,
                        required: true,
                        min_value: 1
                    }
                ]
            },
            {
                name: 'clear',
                description: 'Clears the entire music queue'
            },
            {
                name: 'queue',
                description: 'Displays the server music queue'
            },
            {
                name: 'autoplay',
                description: 'Toggles autoplay for similar tracks'
            },
            {
                name: 'seek',
                description: 'Skips to a specific second in the track',
                options: [
                    {
                        name: 'seconds',
                        description: 'The second to skip to',
                        type: ApplicationCommandOptionType.Integer,
                        required: true,
                        min_value: 0
                    }
                ]
            },
            {
                name: 'purge',
                description: 'Deletes a number of messages in chat',
                options: [
                    {
                        name: 'amount',
                        description: 'Number of messages to delete (1-100)',
                        type: ApplicationCommandOptionType.Integer,
                        required: true,
                        min_value: 1,
                        max_value: 100
                    }
                ]
            },
            {
                name: 'ticket-setup',
                description: 'Configure the ticket support panel',
                options: [
                    {
                        name: 'category',
                        description: 'The category where new tickets will be created',
                        type: ApplicationCommandOptionType.Channel,
                        required: true
                    },
                    {
                        name: 'panel_channel',
                        description: 'The text channel to send the ticket panel to',
                        type: ApplicationCommandOptionType.Channel,
                        required: true
                    },
                    {
                        name: 'log_channel',
                        description: 'The text channel for ticket transcripts',
                        type: ApplicationCommandOptionType.Channel,
                        required: true
                    }
                ]
            }
        ];

        try {
            console.log('[STARTUP] Registering global slash commands...');
            await client.application.commands.set(slashCommands);

            // Register instantly to the main server to bypass Discord's 1-hour global cache
            const guildId = '1496616112379658442';
            const guild = client.guilds.cache.get(guildId) || await client.guilds.fetch(guildId).catch(() => null);
            if (guild) {
                await guild.commands.set(slashCommands);
                console.log(`[STARTUP] Guild slash commands successfully registered for server ${guildId}!`);
            }

            console.log('[STARTUP] Global slash commands successfully registered!');
        } catch (error) {
            console.error('[STARTUP] Failed to register slash commands:', error);
        }
    }
};
