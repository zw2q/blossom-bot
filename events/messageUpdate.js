const { EmbedBuilder } = require('discord.js');
const { db } = require('../db');

module.exports = {
    name: 'messageUpdate',
    async execute(before, after) {
        if (before.partial) before = await before.fetch().catch(() => null);
        if (after.partial) after = await after.fetch().catch(() => null);
        if (!before || !after) return;
        if (before.author?.bot) return;
        if (before.content === after.content) return;

        const setup = db.setups[before.guild.id];
        if (!setup || !setup.logChannelId) return;

        const logChannel = before.guild.channels.cache.get(setup.logChannelId) || 
                           await before.guild.channels.fetch(setup.logChannelId).catch(() => null);
        if (!logChannel) return;

        console.log(`[${new Date().toISOString().replace('T', ' ').substring(0, 19)}] ✏️ Message edited - Author: ${before.author.tag} | Channel: #${before.channel.name}`);

        const embed = new EmbedBuilder()
            .setTitle("✏️ Message edited")
            .setDescription(`**Author:** ${before.author}\n**Channel:** ${before.channel}`)
            .setColor('#FEE75C')
            .setURL(before.url)
            .addFields(
                { name: "Before", value: before.content ? before.content.substring(0, 1024) : "*[empty]*", inline: false },
                { name: "After", value: after.content ? after.content.substring(0, 1024) : "*[empty]*", inline: false }
            )
            .setThumbnail(before.author.displayAvatarURL({ dynamic: true }))
            .setTimestamp();

        await logChannel.send({ embeds: [embed] }).catch(() => {});
    }
};
