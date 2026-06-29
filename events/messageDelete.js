const { EmbedBuilder } = require('discord.js');
const { db } = require('../db');

module.exports = {
    name: 'messageDelete',
    async execute(message) {
        if (message.partial) return;
        if (message.author?.bot) return;

        const setup = db.setups[message.guild.id];
        if (!setup || !setup.logChannelId) return;

        const logChannel = message.guild.channels.cache.get(setup.logChannelId) || 
                           await message.guild.channels.fetch(setup.logChannelId).catch(() => null);
        if (!logChannel) return;

        console.log(`[${new Date().toISOString().replace('T', ' ').substring(0, 19)}] 🗑️ Message deleted - Author: ${message.author.tag} | Channel: #${message.channel.name} | Content: ${message.content ? message.content.substring(0, 100) : 'Empty'}`);

        const embed = new EmbedBuilder()
            .setTitle("🗑️ Message deleted")
            .setDescription(`**Author:** ${message.author}\n**Channel:** ${message.channel}`)
            .setColor('#ED4245')
            .setTimestamp(message.createdAt);

        if (message.content) {
            embed.addFields({ name: "Content", value: message.content.substring(0, 1024), inline: false });
        } else {
            embed.addFields({ name: "Content", value: "*[empty or media]*", inline: false });
        }

        if (message.attachments.size > 0) {
            const attachmentList = message.attachments.map(a => `[${a.name}](${a.url})`).join('\n');
            embed.addFields({ name: "Attachments", value: attachmentList.substring(0, 1024), inline: false });

            const firstAttachment = message.attachments.first();
            if (firstAttachment.contentType && (firstAttachment.contentType.startsWith('image/') || firstAttachment.contentType.startsWith('video/'))) {
                embed.setImage(firstAttachment.url);
            }
        }

        const avatarUrl = message.author.displayAvatarURL({ dynamic: true });
        embed.setThumbnail(avatarUrl);

        await logChannel.send({ embeds: [embed] }).catch(() => {});
    }
};
