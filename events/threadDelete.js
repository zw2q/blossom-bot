const { EmbedBuilder } = require('discord.js');
const { db } = require('../db');

module.exports = {
    name: 'threadDelete',
    async execute(thread) {
        if (!thread.guild) return;

        const setup = db.setups[thread.guild.id];
        if (!setup || !setup.logChannelId) return;

        const logChannel = thread.guild.channels.cache.get(setup.logChannelId) || 
                           await thread.guild.channels.fetch(setup.logChannelId).catch(() => null);
        if (!logChannel) return;

        console.log(`[${new Date().toISOString().replace('T', ' ').substring(0, 19)}] 🗑️ Thread deleted - #${thread.name} in #${thread.parent ? thread.parent.name : 'Unknown'} - Server: ${thread.guild.name}`);

        const embed = new EmbedBuilder()
            .setTitle("🗑️ Thread deleted")
            .setDescription(`**Name:** #${thread.name}\n**Parent channel:** ${thread.parent ? thread.parent : 'Unknown'}`)
            .setColor('#E74C3C')
            .setTimestamp();

        await logChannel.send({ embeds: [embed] }).catch(() => {});
    }
};
