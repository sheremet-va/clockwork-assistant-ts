import { Settings } from '../modules/subscriptions';
import { Embed } from '../helpers/embed';
import { RequestInfo } from '../types';

import * as moment from 'moment-timezone';
import * as Intl from 'intl';

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
    return items.map(({ name, price, canSell, hasTypes, trait }) => {
        const isRu = merchantsLang.includes('ru');
        const canSellString = canSell ? '__' : '';
        const hasTypesString = hasTypes ? ` - _${utils.translate(has_types, language)}_` : '';
        const title = utils.build(name, merchantsLang, '**{{ first }}** - _{{ second }}_');

        const traits = trait.map(traitName => utils.build(traitName, merchantsLang)).join(' / ');
        const cost = [
            new Intl.NumberFormat(isRu ? 'ru-RU' : 'en-US').format(price.gold) + ' g.',
            new Intl.NumberFormat(isRu ? 'ru-RU' : 'en-US').format(price.ap) + ' AP'
        ].join(' / ');

        const strong = title.includes('**') ? '' : '**';

        return `• ${strong}${canSellString}${title}${canSellString}${strong} (${traits}${hasTypesString}): ${cost}`;
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
        description: description + `\n_${utils.translate(can_sell, language)}_`,
        color: 'golden',
        image: 'golden',
        footer: utils.translate(provided, language),
        url: link
    });
}

export { embed };