const { EmbedBuilder } = require('discord.js');
const { db } = require('../db');

module.exports = {
    name: 'guildMemberRemove',
    async execute(member) {
        const setup = db.setups[member.guild.id];
        if (!setup || !setup.logChannelId) return;

        const logChannel = member.guild.channels.cache.get(setup.logChannelId) || 
                           await member.guild.channels.fetch(setup.logChannelId).catch(() => null);
        if (!logChannel) return;

        console.log(`[${new Date().toISOString().replace('T', ' ').substring(0, 19)}] ➖ Member left - ${member.user.tag} (ID: ${member.id}) - Server: ${member.guild.name}`);

        const embed = new EmbedBuilder()
            .setTitle("➖ Member left")
            .setDescription(`${member} left the server`)
            .setColor('#E74C3C')
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
            .setTimestamp();

        await logChannel.send({ embeds: [embed] }).catch(() => {});
    }
};
