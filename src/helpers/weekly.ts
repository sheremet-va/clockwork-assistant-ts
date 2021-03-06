import { Settings } from '../modules/subscriptions';
import { Embed } from './embed';

import * as trials from './pledges';

import { translate } from './utils';
import { Item } from '../types';

export declare type DataSubscriptions = {
    eu: Item;
    na: Item;
}

interface EmbedParams {
    translations: Record<string, string | Record<string, string>>;
    data: DataSubscriptions;
}

function buildEmbed(
    { translations, data }: EmbedParams,
    { pledgesLang, language }: Settings
): Embed {
    const {
        title,
        provided
    } = translations;

    const fields = Object.entries(data)
        .map(([region, trial]) => ({
            name: `${translate(title, language)} (${region.toUpperCase()})`,
            value: trials.build(trial, pledgesLang),
            inline: false
        }));

    return new Embed({
        title: translate(title, language),
        url: 'https://esoleaderboards.com/trial/weekly',
        color: 'weekly',
        thumbnail: 'weekly',
        fields,
        footer: translate(provided, language),
    });
}

export { buildEmbed as embed };