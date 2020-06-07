import { RequestInfo, Item } from '../types';

import { Embed } from '../helpers/embed';
import { translate } from '../helpers/translate';
import { Settings } from '../modules/subscriptions';

export declare type Drop = {
    when: string;
    where: string;
    info: string;
    sending: string;
    image: string | null;
    url: string;
};

export declare type ApiDrop = {
    endDate: number;
    startDate: number;
    image: string;
    info: Item;
    sending: Item;
    sendingDate: number;
    url: string;
    where: Item;
}

export declare type ApiTranslations = {
    title: Item;
    duration: Item;
    where: Item;
    when: Item;
    notice: Item;
    notice_description: Item;
}

function embedMany({ translations, data }: RequestInfo): Embed {
    const {
        title_closest,
        notice_title,
        notice_description
    } = translations as Record<string, string>;

    const fields = (data as Drop[]).map(drop => {
        const description = `• ${drop.where}\n${drop.info} ${drop.sending}`;

        return { name: drop.when, value: description, inline: false };
    });

    return new Embed({
        title: title_closest,
        color: 'drops',
        fields: [
            ...fields,
            { name: notice_title, value: notice_description, inline: false }
        ]
    });
}

async function getWhen(
    client: Assistant,
    { id, startDate, endDate }: { id: string; startDate: number; endDate: number }
): Promise<Record<string, string>> {
    const path = `/drops/translate/when?id=${id}&start=${startDate}&end=${endDate}`;

    const { translations } = await client.request(path, null, '1.0');

    return translations;
}

async function getSendingRender(
    client: Assistant,
    { id, sendingDate }: { id: string; sendingDate: number }
): Promise<Record<string, string>> {
    const path = `/drops/render/sending?id=${id}&start=${sendingDate}`;

    const { data } = await client.request(path, null, '1.0');

    return data;
}

async function embedOne(
    { client, translations, data }: { client: Assistant; translations: ApiTranslations; data: ApiDrop },
    id: string,
    { language }: Settings
): Promise<Embed> {
    const {
        title,
        when: string_when,
        where: string_where,
        notice,
        duration,
        notice_description
    } = translate(translations, language);

    const {
        where,
        info,
        sending,
        image,
        url
    } = data;

    const when = await getWhen(client, { id, ...data });
    const render = await getSendingRender(client, { id, ...data });

    const fields = [
        { name: `${string_when} (${duration})`, value: when[language], inline: false },
        { name: string_where, value: where[language], inline: false },
        { name: notice, value: `${info[language]} ${sending[language].render(render)} ${notice_description}`, inline: false }
    ];

    return new Embed({
        color: 'drops',
        fields,
        title,
        image,
        url
    });
}

export { embedMany, embedOne };