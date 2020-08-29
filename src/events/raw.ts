import { TextChannel } from 'discord.js';

interface Packet {
    t: string;
    s: number;
    op: number;
    d: {
        user_id: string;
        message_id: string;
        emoji: { name: string; id: string | null; animated: boolean };
        channel_id: string;
        guild_id: string;
    };
}

async function event(client: Assistant, packet: Packet): Promise<void> {

    if (packet.t !== 'MESSAGE_REACTION_ADD') {
        return;
    }

    if (packet.d.channel_id !== client.config.dealers.managerChannelID) {
        return;
    }

    const channel = client.channels.cache.get(packet.d.channel_id) as TextChannel;

    if (!channel) {
        return;
    }

    if (channel.messages.cache.has(packet.d.message_id)) {
        return;
    }

    const fetched = await channel.messages.fetch(packet.d.message_id);

    const emoji = packet.d.emoji.id
        ? `${packet.d.emoji.name}:${packet.d.emoji.id}`
        : packet.d.emoji.name;

    const reaction = fetched.reactions.cache.get(emoji);
    const reactionById = fetched.reactions.cache.get(packet.d.emoji.id || emoji);

    const user = client.users.cache.get(packet.d.user_id);

    if (reaction && user) reaction.users.cache.set(packet.d.user_id, user);
    if (reactionById && user) reactionById.users.cache.set(packet.d.user_id, user);

    client.emit('messageReactionAdd', reaction || reactionById, user);
}

export { event };
