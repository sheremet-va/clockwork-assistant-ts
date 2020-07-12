import { MessageReaction, User } from 'discord.js';

function event(
    _client: Assistant,
    _reaction: MessageReaction,
    _user: User
): void {
    // console.log('Emoji: ' + reaction.emoji.name);
    // console.log('Message: ' + reaction.message.id);
    // console.log('User: ' + user.id);
}

export { event };