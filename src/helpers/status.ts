import { Embed, Color } from '../helpers/embed';

import moment from 'moment';

import { Settings } from '../modules/subscriptions';
import { EmbedField } from 'discord.js';

import { translate, notUndefined, entries } from './utils';
import { Item } from '../types';

type TranslationsStrings =
    | 'title'
    | 'UP'
    | 'DOWN'
    | 'maintenance'
    | 'time'
    | 'eu'
    | 'na'
    | 'ps_eu'
    | 'ps_us'
    | 'pts'
    | 'xbox_eu'
    | 'xbox_us';

export declare type TranslationsCommand = {
    [k in TranslationsStrings]: string;
}

export declare type TranslationsSubscriptions = {
    [k in TranslationsStrings]: Item;
} & {
    changed: Item;
    changed_server: Item;
    server: Item;
}

export declare type Status = 'UP' | 'DOWN';

export declare type Statuses = {
    'eu'?: Status;
    'na'?: Status;
    'ps_eu'?: Status;
    'ps_us'?: Status;
    'pts'?: Status;
    'xbox_eu'?: Status;
    'xbox_us'?: Status;
}

export declare type DataCommand = Statuses & {
    maintenance: Maintenance;
}

type Period = { start: number; end: number };

export declare type DataSubscription = Statuses & {
    maintenance: Record<Platform, Period>;
}

type Data = DataCommand | DataSubscription;

export declare type Platform = 'pc' | 'xbox' | 'ps';

export declare type Maintenance = Record<Platform, Render>

export declare type Render = {
    startDate: number;
    endDate: number;
    replaces: {
        start_day: string;
        start_time: string;
        end_day: string;
        end_time: string;
        abbr: string;
    };
}

type CacheData = Record<string, [Platform, Render][]>;

interface Field extends EmbedField {
    region: keyof TranslationsCommand;
}

type EmbedParams = {
    client: Assistant;
    translations: TranslationsCommand | TranslationsSubscriptions;
    data: Data;
}

function isStatus(value: Record<Platform, Render> | Status | Record<Platform, Period>): value is Status {
    return value === 'UP' || value === 'DOWN';
}

function hasStatusValue(
    title: string | keyof TranslationsCommand,
    value: Status
): title is keyof TranslationsCommand {
    return isStatus(value);
}

function isCommandMaintenance(
    maintenance: Record<Platform, Render> | Record<string, Period>
): maintenance is Record<Platform, Render> {
    return 'replaces' in Object.values(maintenance)[0];
}

function isCommand(
    translations: TranslationsSubscriptions | TranslationsCommand
): translations is TranslationsCommand {
    return typeof translations.title === 'string';
}

const CACHE = {} as CacheData;

async function translateMaintence(
    { client, id }: { client: Assistant; id: string },
    maintenance: Record<Platform, Period>,
    { language, timezone }: Settings
): Promise<[Platform, Render][]> {
    const time = moment().format('YYYY MM DD');
    const key = `${time}:${language}-${timezone}`;

    if (CACHE[key]) {
        return CACHE[key];
    }

    const options = {
        url: '/status/render/maintenance?id=' + id,
        method: 'POST' as const,
        data: { maintenance },
        headers: {
            'Content-Type': 'application/json'
        }
    };

    const { translations } = await client.request(options, null, '1.0');

    CACHE[key] = entries<Maintenance>(translations);

    return CACHE[key];
}

function buildMaintence(
    time: string,
    maintenance: [Platform, Render][]
): string {
    const platforms = {
        ps: 'PlayStation',
        pc: 'PC/Mac',
        xbox: 'Xbox One'
    };

    return maintenance
        .map((([platform, { replaces }]) =>
            `**${platforms[platform]}**: ${time.render(replaces)}`
        ))
        .join('\n');
}

function buildFields(
    translations: TranslationsCommand | TranslationsSubscriptions,
    language: string
): ([region, status]: [keyof TranslationsCommand, Status]) => Field {
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
    translations: TranslationsCommand | TranslationsSubscriptions,
    fields: Field[],
    language: string
): string {
    if (isCommand(translations) && fields.length > 1) {
        return translations.title;
    }

    if (isCommand(translations)) {
        const region = translations[fields[0].region];

        return region;
    }

    if (fields.length > 1) {
        return translate(translations.changed, language);
    }

    return translate(translations.changed_server, language).render({ server: fields[0].name });
}

async function embed(
    { client, translations, data }: EmbedParams,
    settings: Settings,
    id: string // TODO guild.id or id
): Promise<Embed> {
    const { language } = settings;

    const builder = buildFields(translations, language);

    const fields = entries(data)
        .map(([param, value]) => {
            if (isStatus(value) && hasStatusValue(param, value)) {
                return builder([param, value]);
            }
        })
        .filter(notUndefined);

    const title = getTitle(translations, fields, language);
    const maintenance = Object.entries(data.maintenance) as [Platform, Render][];

    if (maintenance.length) {
        const description = buildMaintence(
            translate(translations.time, language),
            !isCommandMaintenance(data.maintenance)
                ? await translateMaintence({ client, id }, data.maintenance, settings)
                : maintenance
        );

        fields.unshift(
            {
                name: translate(translations.maintenance, language),
                value: description,
                region: 'maintenance',
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