const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

class CommentModal extends ModalBuilder {
    constructor(thread) {
        super()
            .setCustomId(`comment_modal_${thread.id}`)
            .setTitle('💬 Comment Confession');
        
        const commentInput = new TextInputBuilder()
            .setCustomId('comment')
            .setLabel('Write your comment')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
            .setMaxLength(500);
        
        this.addComponents(new ActionRowBuilder().addComponents(commentInput));
        this.thread = thread;
    }
}

class ConfessionButtons {
    constructor(channelId, threadId = null) {
        this.channelId = channelId;
        this.threadId = threadId;
    }

    getComponents() {
        const row = new ActionRowBuilder();
        
        const commentButton = new ButtonBuilder()
            .setCustomId(`comment_${this.channelId}_${this.threadId || 'null'}`)
            .setLabel('💬 Comment')
            .setStyle(ButtonStyle.Secondary);
        
        const confessButton = new ButtonBuilder()
            .setCustomId(`confess_${this.channelId}`)
            .setLabel('✍️ Confess')
            .setStyle(ButtonStyle.Primary);
        
        row.addComponents(commentButton, confessButton);
        return [row];
    }
}

class ConfessionModal extends ModalBuilder {
    constructor(channelId) {
        super()
            .setCustomId(`confession_modal_${channelId}`)
            .setTitle('📩 Anonymous Confession');
        
        const confessionInput = new TextInputBuilder()
            .setCustomId('confession')
            .setLabel('Write your confession')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Type your confession here...')
            .setRequired(true)
            .setMaxLength(1000);
        
        this.addComponents(new ActionRowBuilder().addComponents(confessionInput));
        this.channelId = channelId;
    }
}

class StartView {
    constructor(channelId) {
        this.channelId = channelId;
    }

    getComponents() {
        const row = new ActionRowBuilder();
        
        const confessButton = new ButtonBuilder()
            .setCustomId(`start_confess_${this.channelId}`)
            .setLabel('✉️ Confess')
            .setStyle(ButtonStyle.Primary);
        
        row.addComponents(confessButton);
        return [row];
    }
}

module.exports = {
    CommentModal,
    ConfessionButtons,
    ConfessionModal,
    StartView
};
