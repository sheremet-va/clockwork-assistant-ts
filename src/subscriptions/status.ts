import { Subscriptions, NotifyData, Settings } from '../modules/subscriptions';

import * as status from '../helpers/status';
import { Embed } from '../helpers/embed';

export default class extends Subscriptions {
    data!: status.DataSubscription;
    translations!: status.TranslationsSubscriptions;

    constructor(client: Assistant, info: NotifyData, name = 'status') {
        super(client, info, name);
    }

    async notify(): Promise<void> {
        const promises = this.guilds.map(async ({ guild, settings }) =>
            ({
                id: guild.id,
                embed: await status.embed(this, settings, guild.id)
            }));

        const embeds = await Promise.all(promises)
            .then(result => result.reduce((total, { id, embed }) =>
                ({ ...total, [id]: embed }), {})) as Record<string, Embed>;

        return this.send((_: Settings, id: string) => embeds[id]);
    }

    static get names(): string[] {
        return [
            'status',
            'statusPC',
            'statusEU',
            'statusNA',
            'statusPTS',
            'statusPS',
            'serverPS_NA',
            'statusPS_EU',
            'statusXBOX',
            'statusXBOX_NA',
            'statusXBOX_EU'
        ];
    }
}