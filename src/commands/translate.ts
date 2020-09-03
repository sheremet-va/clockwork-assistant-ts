// Команда "TRANSLATE" находит переводы в зависимости от переданной строки

import { Message } from 'discord.js';

import { AssistantMessage, RequestInfo } from '../types';

import { Embed } from '../helpers/embed';

type ApiTranslations = Record<string, {
    plural: string;
    aliases: string[];
    results: { ru: string; en: string }[];
}>;

const MAX_ROWS = 15;

function buildFields(translations: Record<string, { plural: string; results: { ru: string; en: string }[] }>): Record<string, string[]> {
    let m = 0,
        k = 0;

    const finalResult = {} as Record<string, string[]>;

    while (m < MAX_ROWS && k < MAX_ROWS) {
        for (const key in translations) {
            const value = translations[key];
            const plural = value.plural;

            if (!finalResult[plural]) {
                finalResult[plural] = [];
            }

            const translation = translations[key].results[m];

            if (translation) {
                const stringified = `• **${translation.ru.capitalize()}** (${translation.en})`;

                finalResult[plural].push(stringified);
                k++;
            }

            if (finalResult[plural].join('\n').length > 1023) {
                finalResult[plural].pop();
                k--;
            }

            if (finalResult[plural].length === 0) {
                delete finalResult[plural];
            }
        }
        m++;
    }

    return finalResult;
}

async function run(
    client: Assistant,
    { channel, ownerId: id }: AssistantMessage,
    _info: RequestInfo,
    args: string[] = []
): Promise<Message | false> {

    if (!args.length) {
        return false;
    }

    const encoded = encodeURI(args.join(' ')).replace('&', '%26').replace('#', '%23').replace('#', '%24');

    const response = await client.request(`/translate?id=${id}&search=${encoded}`, channel, '1.0.0');

    const translations = response.translations as ApiTranslations;
    const { table, query } = response.data as { table: string; query: string };

    const allCount = Object.values(translations).reduce((sum, { results }) => sum + results.length, 0);
    const allCountString = allCount.pluralize(['совпадение', 'совпадения', 'совпадений'], 'ru');

    const embed = new Embed({
        color: 'translate',
        thumbnail: 'magnifier',
        title: `Результаты по запросу «${query}»`,
        url: 'https://elderscrolls.net/tes-online/rueso-glossary/'
    });

    if (table && translations[table]) {
        const fields = buildFields({ [table]: translations[table] });

        const founded = translations[table];
        const count = fields[founded.plural].length;

        const countString = count.pluralize(['совпадение', 'совпадения', 'совпадений'], 'ru');

        embed.addField(founded.plural, fields[founded.plural].join('\n'));

        if (allCount > MAX_ROWS) {
            embed.setDescription(`По вашему запросу было найдено ${countString} (во всех таблицах найдено ${allCountString}).`);
        }

        return channel.send(embed);
    }

    const fields = buildFields(translations);

    const embedFields = Object.entries(fields)
        .map(([name, value]) => {
            const category = Object.values(translations).find(({ plural }) => plural === name);
            const title = category ? `${name} (${category.results.length})` : name;

            return {
                name: title,
                value: value.join('\n'),
                inline: false
            };
        });

    embed.addFields(embedFields);

    if (allCount > MAX_ROWS) {
        const shownCount = embedFields.reduce((sum, { value }) => sum + value.split('\n').length, 0);

        const shown = `Показано ${shownCount.pluralize(['совпадение', 'совпадения', 'совпадений'], 'ru')} из ${allCount}. `;
        const notice = 'Уточните запрос или воспользуйтесь поиском по [ссылке](https://elderscrolls.net/tes-online/rueso-glossary/).';

        embed.setDescription(shown + notice);
    }

    return channel.send(embed);
}

const conf = {
    enabled: true,
    guildOnly: false,
    helpShown: true,
    permLevel: 'Moderator'
};

export { run, conf };
