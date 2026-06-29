const { EmbedBuilder } = require('discord.js');
const { db } = require('../db');

module.exports = {
    name: 'channelCreate',
    async execute(channel) {
        if (!channel.guild) return;

        const setup = db.setups[channel.guild.id];
        if (!setup || !setup.logChannelId) return;

        if (channel.id === setup.logChannelId) return;

        const logChannel = channel.guild.channels.cache.get(setup.logChannelId) || 
                           await channel.guild.channels.fetch(setup.logChannelId).catch(() => null);
        if (!logChannel) return;

        console.log(`[${new Date().toISOString().replace('T', ' ').substring(0, 19)}] 📢 Channel created - #${channel.name} (Type: ${channel.type}) - Server: ${channel.guild.name}`);

        const embed = new EmbedBuilder()
            .setTitle("📢 Channel created")
            .setDescription(`**Name:** ${channel}\n**Type:** ${channel.type}\n**Category:** ${channel.parent ? channel.parent.name : 'None'}`)
            .setColor('#2ECC71')
            .setTimestamp();

        await logChannel.send({ embeds: [embed] }).catch(() => {});
    }
};
