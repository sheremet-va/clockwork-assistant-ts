import { Embed } from '../helpers/embed';
import { TextChannel } from 'discord.js';

async function embed(
    client: Assistant,
    { channel, id: guildId }: { channel: TextChannel; id: string },
    name: string,
    type: string
): Promise<Embed> {
    const options = {
        url: `/subscriptions/${type}?id=${guildId}`,
        method: 'POST' as const,
        data: {
            name,
            channelId: channel.id,
            subject: channel.name,
            type: 'guild'
        },
        headers: {
            'Content-Type': 'application/json',
        }
    };

    const { translations } = await client.request(options, channel, '1.0');
    const { title, success_channel } = translations;

    return new Embed({
        author: title,
        color: 'success',
        description: Embed.emojis.success + success_channel
    });
}

// function embedMany() {

// }

export { embed };