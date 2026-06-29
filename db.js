const fs = require('fs');
const { EmbedBuilder } = require('discord.js');

const ongoingSetups = new Map();

let db = { setups: {}, trusts: {} };
if (fs.existsSync('./db.json')) {
    try {
        const parsed = JSON.parse(fs.readFileSync('./db.json', 'utf8'));
        db.setups = parsed.setups || {};
        db.trusts = parsed.trusts || {};
    } catch (err) {
        console.error("Error loading db.json:", err);
    }
}

function saveDB() {
    fs.writeFileSync('./db.json', JSON.stringify(db, null, 2));
}

async function logToChannel(guild, action, description) {
    const setup = db.setups[guild.id];
    if (!setup || !setup.logChannelId) return;
    const logChannel = guild.channels.cache.get(setup.logChannelId) || await guild.channels.fetch(setup.logChannelId).catch(() => null);
    if (!logChannel) return;

    const embed = new EmbedBuilder()
        .setTitle(`📝 Log: ${action}`)
        .setDescription(description)
        .setColor('#DCE2F0')
        .setTimestamp();
    await logChannel.send({ embeds: [embed] }).catch(() => { });
}

module.exports = { db, saveDB, ongoingSetups, logToChannel };
