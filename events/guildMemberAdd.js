const { EmbedBuilder } = require('discord.js');
const { db } = require('../db');

module.exports = {
    name: 'guildMemberAdd',
    async execute(member) {
        const setup = db.setups[member.guild.id];
        if (!setup || !setup.logChannelId) return;

        const logChannel = member.guild.channels.cache.get(setup.logChannelId) || 
                           await member.guild.channels.fetch(setup.logChannelId).catch(() => null);
        if (!logChannel) return;

        console.log(`[${new Date().toISOString().replace('T', ' ').substring(0, 19)}] ➕ Member joined - ${member.user.tag} (ID: ${member.id}) - Server: ${member.guild.name}`);

        const createdString = member.user.createdAt.toISOString().replace('T', ' ').substring(0, 19);
        const embed = new EmbedBuilder()
            .setTitle("➕ Member joined")
            .setDescription(`${member} joined the server`)
            .setColor('#2ECC71')
            .addFields({ name: "Account created", value: `\`${createdString}\``, inline: false })
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
            .setTimestamp();

        await logChannel.send({ embeds: [embed] }).catch(() => {});
    }
};
