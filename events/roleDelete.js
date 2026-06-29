const { EmbedBuilder } = require('discord.js');
const { db } = require('../db');

module.exports = {
    name: 'roleDelete',
    async execute(role) {
        const setup = db.setups[role.guild.id];
        if (!setup || !setup.logChannelId) return;

        const logChannel = role.guild.channels.cache.get(setup.logChannelId) || 
                           await role.guild.channels.fetch(setup.logChannelId).catch(() => null);
        if (!logChannel) return;

        console.log(`[${new Date().toISOString().replace('T', ' ').substring(0, 19)}] ➖ Role deleted - ${role.name} (ID: ${role.id}) - Server: ${role.guild.name}`);

        const embed = new EmbedBuilder()
            .setTitle("➖ Role deleted")
            .setDescription(`**Name:** ${role.name}\n**Color:** ${role.hexColor}`)
            .setColor('#E74C3C')
            .setTimestamp();

        await logChannel.send({ embeds: [embed] }).catch(() => {});
    }
};
