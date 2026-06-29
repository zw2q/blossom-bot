const { EmbedBuilder } = require('discord.js');
const { db } = require('../db');

module.exports = {
    name: 'guildMemberUpdate',
    async execute(before, after) {
        if (before.nickname === after.nickname) return;

        const setup = db.setups[after.guild.id];
        if (!setup || !setup.logChannelId) return;

        const logChannel = after.guild.channels.cache.get(setup.logChannelId) || 
                           await after.guild.channels.fetch(setup.logChannelId).catch(() => null);
        if (!logChannel) return;

        console.log(`[${new Date().toISOString().replace('T', ' ').substring(0, 19)}] 📝 Nickname changed - ${before.user.username} → ${after.nickname || after.user.username}`);

        const embed = new EmbedBuilder()
            .setTitle("📝 Nickname changed (server)")
            .setDescription(`${after}`)
            .setColor('#F1C40F')
            .addFields(
                { name: "Before", value: before.nickname || before.user.username, inline: true },
                { name: "After", value: after.nickname || after.user.username, inline: true }
            )
            .setThumbnail(after.user.displayAvatarURL({ dynamic: true }))
            .setTimestamp();

        await logChannel.send({ embeds: [embed] }).catch(() => {});
    }
};
