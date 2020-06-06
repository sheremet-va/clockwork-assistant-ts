import { Settings } from '../modules/subscriptions';
import { Embed } from '../helpers/embed';
import { RequestInfo } from '../types';

import * as moment from 'moment-timezone';

import { translate } from './utils';

declare type GoldenItem = {
    name: string;
    price: string;
    trait: string;
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
    { language, has_types }: { language: string; has_types: string | Record<string, string> }
): string {
    return items.map(({ name, price, canSell, hasTypes, trait }) => {
        const canSellString = canSell ? '__' : '';
        const hasTypesString = hasTypes ? ` (${translate(has_types, language)}` : '';

        return `• **${canSellString}${name}${canSellString} (${translate(trait, language)}${hasTypesString})**: ${price}`;
    }).join('\n');
}

function embed({ translations, data }: RequestInfo, settings: Settings): Embed {
    const {
        title,
        can_sell,
        provided,
        has_types
    } = translations;

    const { language, timezone } = settings;
    const { items, link, date } = data as GoldenInfo;

    const description = build(items, { language, has_types });

    const tz_date = moment(date).tz(timezone).locale(language).format('L');

    return new Embed({
        title: translate(title, language).render({ date: tz_date }),
        description: description + `\n_${translate(can_sell, language)}_`,
        color: 'golden',
        image: 'golden',
        footer: translate(provided, language),
        url: link
    });
}

export { embed };