import { Settings } from '../modules/subscriptions';
import { Embed } from '../helpers/embed';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { RequestInfo, language } from '../types';

import moment from 'moment-timezone';
import Intl from 'intl';

import * as utils from './utils';
import { Item } from './pledges';

declare type GoldenItem = {
    name: Item;
    price: {
        gold: number;
        ap: number;
    };
    trait: Item[];
    canSell: boolean;
    hasTypes: boolean;
}

declare interface GoldenInfo {
    name: string;
    link: string;
    date: string;
    items: GoldenItem[];
}

function build(
    items: GoldenItem[],
    { language, merchantsLang, has_types }: {
        language: string;
        has_types: string | Record<string, string>;
        merchantsLang: string;
    }
): string {
    const isRu = merchantsLang.includes('ru');

    return items.map(({ name, price, canSell, hasTypes, trait }) => {
        const hasTypesString = hasTypes ? `(${utils.translate(has_types, language)})` : '';

        const langs = (merchantsLang.split('+') as language[]);

        const names = langs.map((lang) => name[lang]);

        const title = langs
            .filter((lang, i) => name[lang] && names.indexOf(name[lang]) === i)
            .map((lang, i) => {
                const strong = i === 0 ? '**' : '';
                const canSellString = canSell && i === 0 ? '\\*' : '';
                const title = name[lang] || name.en;
                const traits = trait.map(t => t[lang] || t.en).join('/');

                const isActialTraits = !names.includes(traits);

                return `${canSellString}${strong}${title}${strong}${isActialTraits ? ` (${traits})` : ''}`;
            }).join('\n');

        const cost = price.gold > 0 && price.ap > 0 ? [
            new Intl.NumberFormat(isRu ? 'ru-RU' : 'en-US').format(price.gold) + ' GOLD',
            new Intl.NumberFormat(isRu ? 'ru-RU' : 'en-US').format(price.ap) + ' AP'
        ].join(' • ') : '';

        return `• ${title}${cost ? '\n' + cost : ''} ${hasTypesString}`;
    }).join('\n');
}

function embed({ translations, data }: RequestInfo, settings: Settings): Embed {
    const {
        title,
        can_sell,
        provided,
        has_types
    } = translations;

    const { language, timezone, merchantsLang } = settings;
    const { items, link, date } = data as GoldenInfo;

    const description = build(items, { language, merchantsLang, has_types });

    const tz_date = moment(date).tz(timezone).locale(language).format('L');

    return new Embed({
        title: utils.translate(title, language).render({ date: tz_date }),
        description: description + `\n_* — ${utils.translate(can_sell, language).toLowerCase()}_`,
        color: 'golden',
        image: 'golden',
        footer: utils.translate(provided, language),
        url: link
    });
}

export { embed };