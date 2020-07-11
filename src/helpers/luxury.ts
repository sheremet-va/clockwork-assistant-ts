import { Settings } from '../modules/subscriptions';
import { Embed } from '../helpers/embed';
import { RequestInfo, language } from '../types';

import moment from 'moment-timezone';
import Intl from 'intl';

// import * as utils from '../helpers/utils';

type Name = {
    ru: string;
    en: string;
    fr: string;
    de: string;
    icon: string;
}

declare type LuxuryItem = {
    name: Name;
    price: number;
    isNew: boolean;
}

declare interface LuxuryInfo {
    name: string;
    link: string;
    date: string;
    items: LuxuryItem[];
    image: string;
}

function build(items: LuxuryItem[], merchantsLang: string): string {
    return items.map(({ name, price, isNew }) => {
        const isRu = merchantsLang.includes('ru');

        // TODO redo for more LANGUAGES
        const money = new Intl.NumberFormat(isRu ? 'ru-RU' : 'en-US').format(price);

        const title = (merchantsLang.split('+') as language[]).map((lang, i) => {
            const first = i === 0;
            const strong = first ? '**' : '';
            const isNewString = isNew && first ? ':new: ' : '';
            const goldString = first ? `: ${money} g.` : '';
            const title = name[lang] || name.en;

            return `${isNewString}${strong}${title}${strong}${goldString}`;
        }).join('\n');

        // const title = utils.build(name, merchantsLang, '**{{ first }}** - _{{ second }}_');

        // const strong = title.includes('**') ? '' : '**';

        return `• ${title}`;
    }).join('\n');
}

function embed({ translations, data }: RequestInfo, settings: Settings): Embed {
    const { title, provided } = translations;
    const { language, timezone, merchantsLang } = settings;
    const { items, link, date, image } = data as LuxuryInfo;

    const description = build(items, merchantsLang);

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