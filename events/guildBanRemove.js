const { EmbedBuilder } = require('discord.js');
const { db } = require('../db');

module.exports = {
    name: 'guildBanRemove',
    async execute(ban) {
        const { guild, user } = ban;
        const setup = db.setups[guild.id];
        if (!setup || !setup.logChannelId) return;

        const logChannel = guild.channels.cache.get(setup.logChannelId) || 
                           await guild.channels.fetch(setup.logChannelId).catch(() => null);
        if (!logChannel) return;

        console.log(`[${new Date().toISOString().replace('T', ' ').substring(0, 19)}] ✅ Member unbanned - ${user.tag} (ID: ${user.id}) - Server: ${guild.name}`);

        const embed = new EmbedBuilder()
            .setTitle("✅ Member unbanned")
            .setDescription(`${user} was unbanned`)
            .setColor('#2ECC71')
            .setThumbnail(user.displayAvatarURL({ dynamic: true }))
            .setTimestamp();

        await logChannel.send({ embeds: [embed] }).catch(() => {});
    }
};
