// Команда "ПОДПИСКИ" выводит список подписок канала.

import { Message } from 'discord.js';

import { AssistantMessage } from '../types';
import { Embed } from '../helpers/embed';

import {
    SubscriptionDescription,
    ApiSubscriptions,
    ApiTranslations,
    allowed
} from '../helpers/subscriptions';

import { notUndefined } from '../helpers/utils';

function findSub(
    name: string,
    { translations }: { translations: ApiTranslations }
): SubscriptionDescription | undefined {
    const regName = new RegExp(name, 'i');

    return translations.subscriptions.find(({ name, aliases }) => {
        const contains = aliases.some(alias => regName.exec(alias));

        return regName.exec(name) || contains;
    });
}

interface RecievedData {
    data: ApiSubscriptions;
    translations: ApiTranslations;
}

// при вызове команды:
// 1. если есть аргумент, попробует найти указанную рассылку
// 2. если нет аргумента, выведет текущие подписки канала
// 3. если нет подписок у канала, выведет "Не подписан на каналы" (TODO список доступных подписок)

async function run(
    _: Assistant,
    { channel, settings: { prefix, language } }: AssistantMessage,
    { data, translations }: RecievedData,
    [name]: [string | undefined]
): Promise<Message> {
    if (name) {
        const sub = findSub(name, { translations });

        if (sub) {
            const embed = new Embed(
                {
                    author: `${translations.subscription}: ${sub.title}`,
                    description: sub.description,
                    fields: [
                        { name: translations.aliases, value: sub.aliases.join(', '), inline: false }
                    ],
                    color: 'subscriptions'
                }
            );

            return channel.send(embed);
        }
    }

    const channelSubs = Object.entries(data)
        .filter(([, value]) => value.includes(`${channel.id}`))
        .map(([name]) => name); // subs names

    if (!channelSubs.length) {
        const embed = allowed(translations, prefix);

        return channel.send(embed);
    }

    const description = channelSubs
        .map(name => {
            const subscription = translations.subscriptions.find(s => s.name === name);

            if(!subscription) {
                return;
            }

            const { title, description } = subscription;

            const formatted = language === 'ru' ? description.toLowerFirst() : description;

            return `• **${title}**: ${formatted}`;
        })
        .filter(notUndefined)
        .join('\n');

    const embed = new Embed({
        author: translations.subscribed_to,
        description,
        color: 'subscriptions'
    });

    return channel.send(embed);
}

const conf = {
    enabled: true,
    guildOnly: true,
    helpShown: true,
    path: '/subscriptions',
    permLevel: 'User'
};

export { run, conf };