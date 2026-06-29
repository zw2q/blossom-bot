const { EmbedBuilder } = require('discord.js');
const { db } = require('../db');

module.exports = {
    name: 'channelUpdate',
    async execute(before, after) {
        if (!before.guild) return;
        if (before.name === after.name && before.topic === after.topic) return;

        const setup = db.setups[before.guild.id];
        if (!setup || !setup.logChannelId) return;

        const logChannel = before.guild.channels.cache.get(setup.logChannelId) || 
                           await before.guild.channels.fetch(setup.logChannelId).catch(() => null);
        if (!logChannel) return;

        console.log(`[${new Date().toISOString().replace('T', ' ').substring(0, 19)}] ✏️ Channel updated - #${before.name} → #${after.name} - Server: ${before.guild.name}`);

        const embed = new EmbedBuilder()
            .setTitle("✏️ Channel updated")
            .setDescription(`**Channel:** ${after}`)
            .setColor('#E67E22')
            .setTimestamp();

        if (before.name !== after.name) {
            embed.addFields(
                { name: "Name before", value: before.name, inline: true },
                { name: "Name after", value: after.name, inline: true }
            );
        }
        if (before.topic !== after.topic) {
            embed.addFields(
                { name: "Topic before", value: before.topic || "*empty*", inline: false },
                { name: "Topic after", value: after.topic || "*empty*", inline: false }
            );
        }

        await logChannel.send({ embeds: [embed] }).catch(() => {});
    }
};
