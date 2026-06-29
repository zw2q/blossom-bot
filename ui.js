const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

function getInterfaceMessage(guild) {
    const iconUrl = guild.iconURL({ dynamic: true }) || null;
    const emojis = {
        lock: guild.emojis.cache.find(e => e.name === 'vm_lock'),
        unlock: guild.emojis.cache.find(e => e.name === 'vm_unlock'),
        ghost: guild.emojis.cache.find(e => e.name === 'vm_ghost'),
        reveal: guild.emojis.cache.find(e => e.name === 'vm_reveal'),
        rename: guild.emojis.cache.find(e => e.name === 'vm_rename'),
        claim: guild.emojis.cache.find(e => e.name === 'vm_claim'),
        increase: guild.emojis.cache.find(e => e.name === 'vm_increase'),
        decrease: guild.emojis.cache.find(e => e.name === 'vm_decrease'),
        delete: guild.emojis.cache.find(e => e.name === 'vm_delete'),
        info: guild.emojis.cache.find(e => e.name === 'vm_info')
    };

    const getStr = (em, fallback) => em ? `<:${em.name}:${em.id}>` : fallback;
    const getEmoji = (em, fallback) => em ? { id: em.id, name: em.name } : fallback;

    const embed = new EmbedBuilder()
        .setAuthor({ name: guild.name, iconURL: iconUrl })
        .setTitle('VoiceMaster Interface')
        .setDescription(`Manage your voice channel by using the buttons below.\n\n**Button Usage**\n${getStr(emojis.lock, '🔒')} — \`Lock\` the voice channel\n${getStr(emojis.unlock, '🔓')} — \`Unlock\` the voice channel\n${getStr(emojis.ghost, '👻')} — \`Ghost\` the voice channel\n${getStr(emojis.reveal, '👁️')} — \`Reveal\` the voice channel\n${getStr(emojis.rename, '✏️')} — \`Rename\`\n${getStr(emojis.claim, '👑')} — \`Claim\` the voice channel\n${getStr(emojis.increase, '➕')} — \`Increase\` the user limit\n${getStr(emojis.decrease, '➖')} — \`Decrease\` the user limit\n${getStr(emojis.delete, '🗑️')} — \`Delete\`\n${getStr(emojis.info, 'ℹ️')} — \`View channel information\``)
        .setColor('#DCE2F0')
        .setThumbnail(iconUrl);

    const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('vm_lock').setEmoji(getEmoji(emojis.lock, '🔒')).setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('vm_unlock').setEmoji(getEmoji(emojis.unlock, '🔓')).setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('vm_ghost').setEmoji(getEmoji(emojis.ghost, '👻')).setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('vm_reveal').setEmoji(getEmoji(emojis.reveal, '👁️')).setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('vm_claim').setEmoji(getEmoji(emojis.claim, '👑')).setStyle(ButtonStyle.Secondary)
    );

    const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('vm_info').setEmoji(getEmoji(emojis.info, 'ℹ️')).setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('vm_plus').setEmoji(getEmoji(emojis.increase, '➕')).setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('vm_minus').setEmoji(getEmoji(emojis.decrease, '➖')).setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('vm_rename').setEmoji(getEmoji(emojis.rename, '✏️')).setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('vm_delete').setEmoji(getEmoji(emojis.delete, '🗑️')).setStyle(ButtonStyle.Secondary)
    );

    return { embeds: [embed], components: [row1, row2] };
}

module.exports = { getInterfaceMessage };
