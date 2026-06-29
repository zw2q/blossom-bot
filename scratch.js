require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', () => {
    const ids = [
        '1506017739519557764', // lock
        '1506017710377799720', // unlock
        '1506017823561093354', // ghost
        '1506017893266096149', // Reveal
        '1506017881459130539', // Rename
        '1506017770364731473', // Claim
        '1506017841764241578', // Increase
        '1506017789339631868', // Decrease
        '1506017806720962600', // Delete
        '1506017668325707987'  // info
    ];
    
    console.log("Checking emojis...");
    ids.forEach(id => {
        const emoji = client.emojis.cache.get(id);
        if (emoji) {
            console.log(`ID: ${id} | Name: ${emoji.name} | Animated: ${emoji.animated} | String: ${emoji.toString()}`);
        } else {
            console.log(`ID: ${id} | NOT FOUND IN CACHE`);
        }
    });
    process.exit();
});

client.login(process.env.DISCORD_TOKEN);
