const { EmbedBuilder } = require('discord.js');
const { db } = require('../db');

module.exports = {
    name: 'userUpdate',
    async execute(before, after, client) {
        for (const [guildId, guild] of client.guilds.cache) {
            const setup = db.setups[guildId];
            if (!setup || !setup.logChannelId) continue;

            const member = await guild.members.fetch(after.id).catch(() => null);
            if (!member) continue;

            const logChannel = guild.channels.cache.get(setup.logChannelId) || 
                               await guild.channels.fetch(setup.logChannelId).catch(() => null);
            if (!logChannel) continue;

            if (before.username !== after.username) {
                console.log(`[${new Date().toISOString().replace('T', ' ').substring(0, 19)}] 🏷️ Username changed - ${before.username} → ${after.username}`);
                const embed = new EmbedBuilder()
                    .setTitle("🏷️ Username changed")
                    .setColor('#9B59B6')
                    .addFields(
                        { name: "Before", value: before.username, inline: true },
                        { name: "After", value: after.username, inline: true }
                    )
                    .setFooter({ text: `User ID: ${after.id}` })
                    .setThumbnail(after.displayAvatarURL({ dynamic: true }))
                    .setTimestamp();

                await logChannel.send({ embeds: [embed] }).catch(() => {});
            }

            else if (before.avatar !== after.avatar) {
                console.log(`[${new Date().toISOString().replace('T', ' ').substring(0, 19)}] 🖼️ Avatar changed - ${after.username}`);
                const embed = new EmbedBuilder()
                    .setTitle("🖼️ Avatar changed")
                    .setDescription(`${after} changed their avatar`)
                    .setColor('#1ABC9C')
                    .setTimestamp();

                const oldAvatar = before.displayAvatarURL({ dynamic: true, size: 512 });
                const newAvatar = after.displayAvatarURL({ dynamic: true, size: 512 });

                embed.setThumbnail(oldAvatar);
                embed.setImage(newAvatar);
                embed.addFields(
                    { name: "📸 Old avatar", value: `[View old avatar](${oldAvatar})`, inline: false },
                    { name: "🆕 New avatar", value: `[View new avatar](${newAvatar})`, inline: false }
                );

                await logChannel.send({ embeds: [embed] }).catch(() => {});
            }
        }
    }
};
