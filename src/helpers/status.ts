import { Embed, Color } from '../helpers/embed';

import * as moment from 'moment';

import { Settings } from '../modules/subscriptions';
import { EmbedField } from 'discord.js';

import { translate, notUndefined, Translations, SubsTranslations } from './utils';

type Maintence = { replaces: Record<string, string> };
type CacheData = Record<string, [string, Maintence][]>;

const CACHE = {} as CacheData;

async function translateMaintence(
    { client, id }: { client: Assistant; id: string },
    maintence: Record<string, Maintence>,
    { language, timezone }: Settings
): Promise<[string, Maintence][]> {
    const time = moment().format('YYYY MM DD');
    const key = `${time}:${language}-${timezone}`;

    if (CACHE[key]) {
        return CACHE[key];
    }

    const options = {
        url: '/api/status/render/maintence?id=' + id,
        method: 'POST' as 'POST',
        data: { maintence },
        headers: {
            'Content-Type': 'application/json'
        }
    };

    const { translations } = await client.request(options, null, '1.0');

    CACHE[key] = Object.entries(translations);

    return CACHE[key];
}

function buildMaintence(
    time: string,
    maintence: [string, { replaces: Record<string, string> }][]
): string {
    return maintence
        .map((([platform, { replaces }]) => `**${platform}**: ${time.render(replaces)}`))
        .join('\n');
}

function buildFields(
    translations: Translations | SubsTranslations,
    language: string
): ([region, status]: [string, 'UP' | 'DOWN']) => Field {
    const emoji = {
        UP: ':white_check_mark: ',
        DOWN: ':x: '
    };

    return ([region, status]): Field => ({
        name: translate(translations[region], language),
        value: emoji[status] + translate(translations[status], language),
        region,
        inline: false
    });
}

function getTitle(
    translations: Translations | SubsTranslations,
    fields: Field[],
    language: string
): string {
    if (!language && fields.length > 1 && typeof translations.title === 'string') {
        return translations.title;
    }

    if (!language) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const region = translations[fields[0].region!] as string;

        return region;
    }

    if (fields.length > 1) {
        return translate(translations.changed, language);
    }

    return translate(translations.changed_server, language).render({ server: fields[0].name });
}

interface Field extends EmbedField {
    region?: string;
}

type EmbedParams = {
    client: Assistant;
    translations: SubsTranslations;
    data: ParamsData;
}

type ParamsData = {
    en: 'UP' | 'DOWN';
    maintence: Record<string, Maintence>;
}

async function embed(
    { client, translations, data }: EmbedParams,
    settings: Settings,
    id: string // TODO guild.id or id
): Promise<Embed> {
    const { language } = settings;

    const fields = Object.entries(data)
        .map(([param, value]) => {
            if (value === 'UP' || value === 'DOWN') {
                return buildFields(translations, language)([param, value]);
            }
        })
        .filter(notUndefined);

    const title = getTitle(translations, fields, language);
    const maintence = Object.entries(data.maintence);

    if (maintence.length) {
        const description = buildMaintence(
            translate(translations.time, language),
            language
                ? await translateMaintence({ client, id }, data.maintence, settings)
                : maintence
        );

        fields.unshift(
            {
                name: translate(translations.maintence, language),
                value: description,
                inline: false
            }
        );
    }

    const down = fields.some(({ value }) => /DOWN/i.test(value));

    const embed = {
        author: title,
        color: down ? 'error' : 'success' as Color
    };

    if (fields.length > 1) {
        return new Embed({ ...embed, fields });
    }

    const description = fields[0].value;

    return new Embed({ ...embed, description });
}

export { embed };