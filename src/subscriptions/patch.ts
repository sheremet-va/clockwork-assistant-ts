import { Subscriptions, NotifyData } from '../modules/subscriptions';

import * as patch from '../helpers/patch';

export default class extends Subscriptions {
    data!: patch.DataSubscriptions;

    constructor(client: Assistant, info: NotifyData) {
        super(client, info, 'patch');
    }

    async notify(): Promise<void> {
        return this.send(settings => patch.embed(this, settings.language));
    }
}