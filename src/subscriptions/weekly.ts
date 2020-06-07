import { Subscriptions, NotifyData } from '../modules/subscriptions';

import * as weekly from '../helpers/weekly';

export default class extends Subscriptions {
    data!: weekly.DataSubscriptions;

    constructor(client: Assistant, info: NotifyData) {
        super(client, info, 'weekly');
    }

    async notify(): Promise<void> {
        this.send(settings => weekly.embed(this, settings));
    }
}