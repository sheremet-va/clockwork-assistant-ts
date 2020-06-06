import { Settings } from '../modules/subscriptions';
import { Embed } from '../helpers/embed';
import { RequestInfo } from '../types';

import * as moment from 'moment-timezone';

declare type LuxuryItem = {
    name: string;
    price: string;
    isNew: boolean;
}

declare interface LuxuryInfo {
    name: string;
    link: string;
    date: string;
    items: LuxuryItem[];
    image: string;
}

function build(items: LuxuryItem[]): string {
    return items.map(({ name, price, isNew }) => {
        return `• ${isNew ? ':new: ' : ''}**${name}**: ${price}`;
    }).join('\n');
}

function embed({ translations, data }: RequestInfo, settings: Settings): Embed {
    const { title, provided } = translations;
    const { language, timezone } = settings;
    const { items, link, date, image } = data as LuxuryInfo;

    const description = build(items);

    const tz_date = moment(date).tz(timezone).locale(language).format('L');

    return new Embed(
        {
            title: (title[language] || title).render({ date: tz_date }),
            description,
            color: 'luxury',
            footer: provided[language] || provided,
            image,
            url: link
        }
    );
}

export { embed };