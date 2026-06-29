const { PermissionsBitField, ChannelType } = require('discord.js');
const { db, logToChannel } = require('../db');

module.exports = {
    name: 'voiceStateUpdate',
    async execute(oldState, newState) {
        const setup = db.setups[newState.guild.id] || db.setups[oldState.guild?.id];
        if (!setup) return;

        // 1. Utente ENTRA in un canale
        if (newState.channelId === setup.joinChannelId) {
            try {
                const overwrites = [
                    {
                        id: newState.member.id,
                        allow: [PermissionsBitField.Flags.ManageChannels, PermissionsBitField.Flags.ManageRoles, PermissionsBitField.Flags.DeafenMembers, PermissionsBitField.Flags.MuteMembers, PermissionsBitField.Flags.MoveMembers]
                    }
                ];

                const trusted = db.trusts[newState.member.id] || [];
                for (const userId of trusted) {
                    overwrites.push({
                        id: userId,
                        allow: [PermissionsBitField.Flags.Connect, PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
                    });
                }

                // Crea un nuovo canale vocale nella stessa categoria
                const newChannel = await newState.guild.channels.create({
                    name: `${newState.member.user.username}'s channel`,
                    type: ChannelType.GuildVoice,
                    parent: setup.categoryId,
                    permissionOverwrites: overwrites
                });
                await logToChannel(newState.guild, "Channel Created", `**User:** ${newState.member}\n**Channel:** ${newChannel}`);

                // Sposta l'utente nel nuovo canale
                await newState.setChannel(newChannel).catch(async () => {
                    // Se l'utente esce mentre si sta creando il canale, il setChannel fallisce.
                    // In questo caso eliminiamo il canale appena creato.
                    await newChannel.delete().catch(() => { });
                });
            } catch (error) {
                console.error("Errore durante la creazione del canale vocale:", error);
            }
        }

        // 2. Utente ESCE da un canale o si SPOSTA
        if (oldState.channelId) {
            // Se il canale che l'utente ha lasciato è dentro la categoria di setup...
            // ...E NON è il canale principale "Join to Create"
            // ...E il canale è vuoto
            if (
                oldState.channel &&
                oldState.channel.parentId === setup.categoryId &&
                oldState.channelId !== setup.joinChannelId &&
                oldState.channel.members.size === 0
            ) {
                try {
                    await logToChannel(oldState.guild, "Channel Deleted", `**Name:** ${oldState.channel.name}\n**Reason:** Empty`);
                    await oldState.channel.delete();
                } catch (error) {
                    console.error("Errore nell'eliminare il canale vuoto:", error);
                }
            }
        }

        // Voice Channel Logs
        if (setup.logChannelId) {
            const logChannel = newState.guild.channels.cache.get(setup.logChannelId) || 
                               await newState.guild.channels.fetch(setup.logChannelId).catch(() => null);
            if (logChannel) {
                const member = newState.member;
                const { EmbedBuilder } = require('discord.js');

                // 1. Utente entra in un VC (prima non era in nessun VC)
                if (!oldState.channelId && newState.channelId) {
                    console.log(`[${new Date().toISOString().replace('T', ' ').substring(0, 19)}] 🔊 Voice join - ${member.user.tag} joined ${newState.channel.name}`);
                    const embed = new EmbedBuilder()
                        .setTitle("🔊 Joined voice channel")
                        .setDescription(`${member} joined ${newState.channel}`)
                        .setColor('#57F287')
                        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
                        .setTimestamp();
                    await logChannel.send({ embeds: [embed] }).catch(() => {});
                }
                // 2. Utente esce da un VC (ora non è in nessun VC)
                else if (oldState.channelId && !newState.channelId) {
                    console.log(`[${new Date().toISOString().replace('T', ' ').substring(0, 19)}] 🔇 Voice leave - ${member.user.tag} left ${oldState.channel.name}`);
                    const embed = new EmbedBuilder()
                        .setTitle("🔇 Left voice channel")
                        .setDescription(`${member} left ${oldState.channel}`)
                        .setColor('#ED4245')
                        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
                        .setTimestamp();
                    await logChannel.send({ embeds: [embed] }).catch(() => {});
                }
                // 3. Utente si sposta di VC
                else if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
                    console.log(`[${new Date().toISOString().replace('T', ' ').substring(0, 19)}] 🔄 Voice switch - ${member.user.tag} moved from ${oldState.channel.name} to ${newState.channel.name}`);
                    const embed = new EmbedBuilder()
                        .setTitle("🔄 Switched voice channel")
                        .setDescription(`${member} moved from ${oldState.channel} to ${newState.channel}`)
                        .setColor('#3498DB')
                        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
                        .setTimestamp();
                    await logChannel.send({ embeds: [embed] }).catch(() => {});
                }
            }
        }
    }
};
