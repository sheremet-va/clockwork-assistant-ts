import { DMChannel, NewsChannel, TextChannel } from 'discord.js';

import { Embed, EmbedColor, Emoji } from '../helpers/embed';

async function embed(
    { client, channel }: { client: Assistant; channel: DMChannel | TextChannel | NewsChannel },
    { type, value, id }: { type: string; value: string; id: string }
): Promise<Embed> {
    const options = {
        url: '/settings?id=' + id,
        method: 'POST' as const,
        data: { type, value },
        headers: {
            'Content-Type': 'application/json',
        }
    };

    const { translations: { success } } = await client.request(options, channel, '1.0');

    return new Embed({
        color: EmbedColor.Success,
        description: Emoji.Success + (success as string)
    });
}

export { embed };