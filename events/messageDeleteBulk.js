const { EmbedBuilder } = require('discord.js');
const { db } = require('../db');

module.exports = {
    name: 'messageDeleteBulk',
    async execute(messages) {
        const firstMsg = messages.first();
        if (!firstMsg || !firstMsg.guild) return;

        const setup = db.setups[firstMsg.guild.id];
        if (!setup || !setup.logChannelId) return;

        const logChannel = firstMsg.guild.channels.cache.get(setup.logChannelId) || 
                           await firstMsg.guild.channels.fetch(setup.logChannelId).catch(() => null);
        if (!logChannel) return;

        console.log(`[${new Date().toISOString().replace('T', ' ').substring(0, 19)}] 🗑️🗑️ Bulk delete - ${messages.size} messages deleted in #${firstMsg.channel.name} - Server: ${firstMsg.guild.name}`);

        const embed = new EmbedBuilder()
            .setTitle("🗑️ Bulk messages deleted")
            .setDescription(`**Channel:** ${firstMsg.channel}\n**Messages deleted:** ${messages.size}`)
            .setColor('#992D22')
            .setTimestamp();

        const sampleLines = [];
        const sortedMsgs = Array.from(messages.values()).reverse();
        for (const msg of sortedMsgs.slice(0, 5)) {
            if (msg.author) {
                sampleLines.push(`- **${msg.author.tag}**: ${msg.content ? msg.content.substring(0, 50) : '*[empty/media]*'}`);
            }
        }

        if (sampleLines.length > 0) {
            embed.addFields({ name: "Sample of deleted messages", value: sampleLines.join('\n').substring(0, 1024), inline: false });
        }

        await logChannel.send({ embeds: [embed] }).catch(() => {});
    }
};
