const { EmbedBuilder, AuditLogEvent } = require('discord.js');
const { db } = require('../db');

module.exports = {
    name: 'guildBanAdd',
    async execute(ban) {
        const { guild, user } = ban;
        const setup = db.setups[guild.id];
        if (!setup || !setup.logChannelId) return;

        const logChannel = guild.channels.cache.get(setup.logChannelId) || 
                           await guild.channels.fetch(setup.logChannelId).catch(() => null);
        if (!logChannel) return;

        console.log(`[${new Date().toISOString().replace('T', ' ').substring(0, 19)}] 🔨 Member banned - ${user.tag} (ID: ${user.id}) - Server: ${guild.name}`);

        const embed = new EmbedBuilder()
            .setTitle("🔨 Member banned")
            .setDescription(`${user} was banned`)
            .setColor('#992D22')
            .addFields({ name: "User ID", value: user.id, inline: false })
            .setThumbnail(user.displayAvatarURL({ dynamic: true }))
            .setTimestamp();

        const fetchedLogs = await guild.fetchAuditLogs({
            limit: 1,
            type: AuditLogEvent.MemberBanAdd
        }).catch(() => null);

        if (fetchedLogs) {
            const banLog = fetchedLogs.entries.first();
            if (banLog && banLog.target.id === user.id) {
                embed.addFields(
                    { name: "Moderator", value: `${banLog.executor}`, inline: true },
                    { name: "Reason", value: banLog.reason || "No reason provided", inline: false }
                );
            }
        }

        await logChannel.send({ embeds: [embed] }).catch(() => {});
    }
};
