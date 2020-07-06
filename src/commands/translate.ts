// Команда "TRANSLATE" находит переводы в зависимости от переданной строки

import { Message } from 'discord.js';

import { AssistantMessage, RequestInfo } from '../types';

import { ClientError } from '../modules/error';
import axios from 'axios';
import { Embed } from '../helpers/embed';

const tables = {
    'Достижение': {
        plural: 'Достижения',
        aliases: ['достижение', 'Достижение', 'достижения', 'Достижения', 'ачивка'],
        results: []
    },
    'Квест': {
        plural: 'Задания',
        aliases: ['задание', 'квест', 'Квест', 'задания', 'квесты', 'Квесты'],
        results: []
    },
    'Предмет': {
        plural: 'Предметы',
        aliases: ['предмет', 'Предмет', 'итем', 'предметы', 'Предметы', 'итемы'],
        results: []
    },
    'NPC': {
        plural: 'Персонажи',
        aliases: ['нип', 'нпс', 'персонаж', 'NPC', 'НИП', 'нипы', 'персонажи', 'НИПЫ'],
        results: []
    },
    'Локация': {
        plural: 'Локации',
        aliases: ['лока', 'локация', 'Локация', 'локи', 'локации', 'Локации'],
        results: []
    },
    'Коллекционный предмет': {
        plural: 'Коллекционные предметы',
        aliases: ['коллекционные', 'коллекционки', 'коллекционка', 'колл'],
        results: []
    }
} as Record<string, {
    plural: string;
    aliases: string[];
    results: string[];
}>;

const MAX_ROWS = 15;

function getTable(search: string): string | null {
    const item = Object.entries(tables)
        .find(([, { aliases }]) => aliases.includes(search));

    return (item || [null])[0];
}

function clean(value: string): string {
    return value.replace('<<player{','').replace('}>>','').replace(/\^\w+$/,'');
}

function isEmpty(object: typeof tables): boolean {
    return Boolean(Object.values(object).filter(({ results }) => results.length).length);
}

function buildFields(translations: Record<string, { results: string[] }>): Record<string, string> {
    const fields = Object.entries(translations)
        .reduce((acc, [table, { results }]) => {
            const field = results.reduce((joined, string) => {
                if(joined.length > 1023) {
                    return joined;
                }

                return `${joined}\n${string}`;
            }, '');

            return {
                ...acc,
                [table]: field.trim()
            };
        }, {} as Record<string, string>);

    return fields;
}

async function run(
    _client: Assistant,
    { channel }: AssistantMessage,
    _info: RequestInfo,
    [search = '']
): Promise<Message | false> {

    if(!search) {
        return false;
    }

    const table = getTable(search);
    const query = search.replace(table || '', '');

    if(query.length < 4) {
        throw new ClientError('Пожалуйста, введите запрос длиной больше 3 символов (не считая категории)', '', channel);
    }

    const encodedSearch = encodeURI(query).replace('&','%26').replace('#','%23').replace('#','%24');

    const apiUrl = `http://ruesoportal.elderscrolls.net/ESOBase/searchservlet/?searchtext=${encodedSearch}`;

    // try catch
    const { data } = await axios.get(apiUrl);
    const empty = data === 'parseResponse([]);';

    const tableError = table ? `в таблице «${table}» ` : '';
    const error = `К сожалению, по запросу «${query}» ${tableError}ничего не найдено.`;

    if(empty) {
        throw new ClientError(error, '', channel);
    }

    const result = JSON.parse(data.replace('parseResponse(','').replace(');','')) as {
        tableName: string;
        textRuOff: string;
        textEn: string;
    }[];

    const skip = ['Описание способности', 'Описание коллекционного предмета'];

    const translations = result.reduce((acc, { tableName, textRuOff, textEn }) => {
        if(!tableName || skip.includes(tableName) || !(tableName in tables)) {
            return acc;
        }

        const cleanedRu = clean(textRuOff);
        const cleanedEn = clean(textEn);

        const stringified = `• **${cleanedRu.capitalize()}** (${cleanedEn})`;

        if(acc[tableName].results.includes(stringified)) {
            return acc;
        }

        acc[tableName].results.push(stringified);

        return acc;
    }, tables);

    if(isEmpty(translations)) {
        throw new ClientError(error, '', channel);
    }

    if(table && translations[table] && !translations[table].results) {
        throw new ClientError(error, '', channel);
    }

    const allCount = Object.values(translations).reduce((sum, { results }) => sum + results.length, 0);
    const allCountString = allCount.pluralize(['совпадение', 'совпадения', 'совпадений'], 'ru');

    const fields = buildFields(translations);

    const embed = new Embed({
        color: 'translate',
        thumbnail: 'magnifier',
        title: `Результаты по запросу «${query}»`,
        url: 'https://elderscrolls.net/tes-online/rueso-glossary/'
    });

    if(table && fields[table]) {
        const founded = translations[table];
        const count = founded.results.length;

        const countString = count.pluralize(['совпадение', 'совпадения', 'совпадений'], 'ru');

        embed.addField(founded.plural, fields[table]);

        if(allCount > MAX_ROWS) {
            embed.setDescription(`По вашему запросу было найдено ${countString} (во всех таблицах найдено ${allCountString}).`);
        }

        return channel.send(embed);
    }

    const embedFields = Object.entries(fields).map(([name, value]) => ({ name, value, inline: false }));

    embed.addFields(embedFields);

    if(allCount > MAX_ROWS) {
        const shownCount = embedFields.reduce((sum, { value }) => sum + value.split('\n').length, 0);

        const shown = `Показано ${shownCount.pluralize(['совпадение', 'совпадения', 'совпадений'], 'ru')} из ${allCountString}.`;
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
