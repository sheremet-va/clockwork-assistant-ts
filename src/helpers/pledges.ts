import { Embed } from './embed';
import { Settings } from '../modules/subscriptions';

import { translate, Translations, SubsTranslations } from './utils';

function title(
    days: string,
    translations: Record<string, string>
): string {
    const {
        after_days,
        tomorrow,
        today,
        date,
        day
    } = translations;

    if (`${days}` === '0') {
        return today;
    }

    if (`${days}` === '1') {
        return tomorrow;
    }

    return `${after_days} (${date}, ${day})`;
}

function build(
    subject: Record<string, string>,
    type: string
): string {
    return type.replace(/(\w+)\+(\w+)|(\w+)/, (lang, lang1, lang2) => {
        if(!lang2 && !(lang in subject)) {
            return subject.en;
        }

        if (!lang1) {
            return subject[lang].capitalize();
        }

        if (subject[lang1] !== subject[lang2]) {
            return `${subject[lang1].capitalize()} (${subject[lang2]})`;
        }

        return subject[lang1].capitalize();
    });
}

function urlMask(
    mask: Record<string, string>,
    lang: string
): string {
    const title = build(mask, lang);

    const base_url = 'https://eso-sets.com/set/';
    const mask_url = (mask.en).replace(/\s/g, '-').toLowerCase();

    return `[${title}](${base_url + mask_url})`;
}

function buildTomorrow(
    pledges: Record<Vendors, Item>,
    type: string
): string {
    const translate = (lang: string) => {
        return (title: Record<string, string>, i: number): string =>
            i === 0 ? (title[lang] || title.en).capitalize() : (title[lang] || title.en);
    };

    const pledgesNames = Object.values(pledges);

    return type.replace(/(\w+)\+(\w+)|(\w+)/, (lang, lang1, lang2) => {
        if (!lang1) {
            return pledgesNames.map(translate(lang)).join(', ');
        }

        const pledges1 = pledgesNames.map(translate(lang1)).join(', ');
        const pledges2 = pledgesNames.map(translate(lang2)).join(', ');

        if (pledges1 !== pledges2) {
            return `${pledges1}\n${pledges2}`;
        }

        return pledges1;
    });
}

export declare type Vendors = 'maj' | 'glirion' | 'urgarlag';
export declare type Item = Record<'en' | 'ru', string>;

export declare type Data = Record<'pledges' | 'masks', Record<Vendors, Item>>;

// TODO MASK LANGUAGE
function buildEmbed(
    embed: Embed,
    { pledgesLang, language }: Settings,
    tData: { data?: Data } | null,
    { translations, data: { pledges, masks } }: { translations: Translations | SubsTranslations; data: Data }
): Embed {
    const { tomorrow, mask } = translations;

    const strings = {
        tomorrow: translate(tomorrow, language),
        mask: translate(mask, language)
    };

    const fields = Object.entries(pledges).map(([vendor, pledge]) => ({
        name: build(pledge, pledgesLang),
        value: `${strings.mask}: ${urlMask(masks[vendor as Vendors], pledgesLang)}`
    }));

    embed.setColor('pledges').addFields(fields);

    if (tData) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        embed.addField(strings.tomorrow, buildTomorrow(tData.data!.pledges, pledgesLang));
    }

    return embed;
}

export {
    buildEmbed as embed,
    title,
    build
};