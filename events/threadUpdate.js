const { EmbedBuilder } = require('discord.js');
const { db } = require('../db');

module.exports = {
    name: 'threadUpdate',
    async execute(before, after) {
        if (!before.guild) return;
        if (before.name === after.name && before.archived === after.archived) return;

        const setup = db.setups[before.guild.id];
        if (!setup || !setup.logChannelId) return;

        const logChannel = before.guild.channels.cache.get(setup.logChannelId) || 
                           await before.guild.channels.fetch(setup.logChannelId).catch(() => null);
        if (!logChannel) return;

        console.log(`[${new Date().toISOString().replace('T', ' ').substring(0, 19)}] ✏️ Thread updated - ${before.name} → ${after.name} - Server: ${before.guild.name}`);

        const embed = new EmbedBuilder()
            .setTitle("✏️ Thread updated")
            .setDescription(`**Thread:** ${after}`)
            .setColor('#E67E22')
            .setTimestamp();

        if (before.name !== after.name) {
            embed.addFields(
                { name: "Name before", value: before.name, inline: true },
                { name: "Name after", value: after.name, inline: true }
            );
        }
        if (before.archived !== after.archived) {
            embed.addFields(
                { name: "Archived", value: String(after.archived), inline: true }
            );
        }

        await logChannel.send({ embeds: [embed] }).catch(() => {});
    }
};
