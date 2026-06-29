const { EmbedBuilder } = require('discord.js');
const { db } = require('../db');

module.exports = {
    name: 'roleCreate',
    async execute(role) {
        const setup = db.setups[role.guild.id];
        if (!setup || !setup.logChannelId) return;

        const logChannel = role.guild.channels.cache.get(setup.logChannelId) || 
                           await role.guild.channels.fetch(setup.logChannelId).catch(() => null);
        if (!logChannel) return;

        console.log(`[${new Date().toISOString().replace('T', ' ').substring(0, 19)}] ➕ Role created - ${role.name} (ID: ${role.id}) - Server: ${role.guild.name}`);

        const embed = new EmbedBuilder()
            .setTitle("➕ Role created")
            .setDescription(`**Name:** ${role}\n**Color:** ${role.hexColor}\n**Position:** ${role.position}`)
            .setColor('#2ECC71')
            .setTimestamp();

        await logChannel.send({ embeds: [embed] }).catch(() => {});
    }
};
