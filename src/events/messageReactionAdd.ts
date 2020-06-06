import { MessageReaction, User } from 'discord.js';

export default (
    client: Assistant,
    reaction: MessageReaction,
    user: User
): void => {
    console.log('Emoji: ' + reaction.emoji.name);
    console.log('Message: ' + reaction.message.id);
    console.log('User: ' + user.id);
};