// Команда "ПОДПИСКИ" выводит список подписок канала.

import { Message } from 'discord.js';

import { AssistantMessage } from '../types';
import { Embed } from '../helpers/embed';

// import * as subscriptions from '../helpers/subscriptions';

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

interface SubscriptionDescription {
    title: string;
    description: string;
    name: string;
    aliases: string[];
}

type ApiSubscriptions = Record<string, string[]>;

type ApiTranslations = Record<string, string> & {
    subscriptions: SubscriptionDescription[];
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
    { channel, settings: { prefix } }: AssistantMessage,
    { data, translations }: RecievedData,
    [name]: [string | undefined]
): Promise<Message> {
    if(name) {
        const sub = findSub(name, { translations });

        if(sub) {
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

    if(!channelSubs.length) {
        // const fields = Object.values( translations.subscriptions )
        //     .map( ({ title, description, name }) => )

        // console.log( fields );

        const embed = new Embed(
            {
                author: translations.title,
                description: `${translations.no_subscriptions} ${translations.to_subscribe.render({ prefix })}.`,
                color: 'subscriptions'
            }
        );

        return channel.send(embed);
    }

    const description = channelSubs
        .map(name => {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const { title, description } = translations.subscriptions.find(s => s.name === name)!;

            return `• **${title}**: ${description.toLowerFirst()}`;
        })
        .join('\n');

    const embed = new Embed({ description });

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