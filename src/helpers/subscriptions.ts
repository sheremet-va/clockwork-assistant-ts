import { Embed } from '../helpers/embed';
import { TextChannel } from 'discord.js';

import { entries, notUndefined } from '../helpers/utils';

export declare interface SubscriptionDescription {
    title: string;
    description: string;
    name: string;
    aliases: string[];
}

export declare type ApiSubscriptions = Record<string, string[]>;

export declare type ApiTranslations = Record<string, string> & {
    subscriptions: SubscriptionDescription[];
    groups: Record<string, string[]>;
}

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

function allowed(translations: ApiTranslations, prefix: string, subscribed = false): Embed {
    const fields = entries(translations.groups).map(([name, subscriptions]) => {
        return {
            name: translations[name] || name,
            value: subscriptions.map(code => {
                const subscription = translations.subscriptions.find(sub => sub.name === code);

                return subscription?.title;
            }).filter(notUndefined).join('\n'),
            inline: true
        };
    });

    const embed = new Embed(
        {
            author: translations.title,
            description: `${subscribed ? '' : translations.no_subscriptions + ' '}${translations.to_subscribe.render({ prefix })}`,
            fields,
            color: 'subscriptions'
        }
    );

    return embed;
}

// function embedMany() {

// }

export { embed, allowed };