require('dotenv').config();
const { Client, GatewayIntentBits, Partials } = require('discord.js');
const { Player } = require('discord-player');
const { DefaultExtractors } = require('@discord-player/extractor');
const { YoutubeiExtractor } = require('discord-player-youtubei');
const fs = require('fs');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildModeration
    ],
    partials: [
        Partials.Message,
        Partials.Channel,
        Partials.User,
        Partials.GuildMember
    ]
});

// Ensure yt-dlp binary is downloaded and has execute permissions on startup
try {
    const fs = require('fs');
    const path = require('path');
    const ytConstants = require('youtube-dl-exec/src/constants');
    const binPath = ytConstants.YOUTUBE_DL_PATH;

    if (!fs.existsSync(binPath)) {
        console.log('[STARTUP] yt-dlp binary missing! Downloading/installing now...');
        const spawn = require('child_process').spawnSync;
        const postinstallScript = path.join(__dirname, 'node_modules', 'youtube-dl-exec', 'scripts', 'postinstall.js');
        const runInstaller = spawn('node', [postinstallScript], { stdio: 'inherit' });
        if (runInstaller.error) {
            console.error('[STARTUP] Failed to automatically install yt-dlp binary:', runInstaller.error);
        } else {
            console.log('[STARTUP] yt-dlp binary successfully downloaded!');
        }
    } else {
        console.log(`[STARTUP] yt-dlp binary exists at: ${binPath}`);
    }

    // Always ensure execute permissions on Linux/Unix platforms
    if (process.platform !== 'win32' && fs.existsSync(binPath)) {
        try {
            fs.chmodSync(binPath, '755');
            console.log('[STARTUP] yt-dlp execution permissions (755) successfully ensured!');
        } catch (chmodErr) {
            console.error('[STARTUP] Failed to apply execution permissions (chmod 755) to yt-dlp binary:', chmodErr);
        }
    }
} catch (startupErr) {
    console.error('[STARTUP] Error verifying/installing yt-dlp at startup:', startupErr);
}

// Set FFmpeg path for Linux/Ubuntu and cross-platform compatibility
try {
    process.env.FFMPEG_PATH = require('ffmpeg-static');
    console.log(`[DEBUG] FFmpeg Path configured to: ${process.env.FFMPEG_PATH}`);
} catch (e) {
    console.error('[DEBUG] Failed to load ffmpeg-static:', e);
}

// Setup Player
const player = new Player(client);
player.extractors.register(YoutubeiExtractor, {});
player.extractors.loadMulti(DefaultExtractors);
client.player = player;

// Register player events for logging
player.events.on('error', (queue, error) => {
    console.error(`PLAYER ERROR:`, error);
});
player.events.on('playerError', (queue, error) => {
    console.error(`PLAYER CONNECTION ERROR:`, error);
});
player.events.on('connection', (queue) => {
    console.log("[4] VC Connected");
    console.log("[12] Player subscribed");
    
    if (queue.dispatcher) {
        const connection = queue.dispatcher.voiceConnection;
        const audioPlayer = queue.dispatcher.audioPlayer;
        
        if (audioPlayer) {
            audioPlayer.on("stateChange", (o, n) => {
                console.log("Player:", o.status, "->", n.status);
            });
            audioPlayer.on("error", e => {
                console.error("PLAYER ERROR:", e);
            });
        }
        
        if (connection) {
            connection.on("stateChange", (o, n) => {
                console.log("Connection:", o.status, "->", n.status);
            });
            connection.on("error", e => {
                console.error("VC ERROR:", e);
            });
        }
    }
});
player.events.on('playerStart', (queue, track) => {
    console.log("[11] Player.play()");
    console.log("[13] Audio should play now");
});

// Load events dynamically
const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));
for (const file of eventFiles) {
    const event = require(`./events/${file}`);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
    } else {
        client.on(event.name, (...args) => event.execute(...args, client));
    }
}

// Prevent bot from crashing due to unhandled promise rejections (like duplicated interactions)
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

client.login(process.env.DISCORD_TOKEN);
