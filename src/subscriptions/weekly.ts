import { Subscriptions, NotifyData } from '../modules/subscriptions';

import * as weekly from '../helpers/weekly';

export default class extends Subscriptions {
    constructor(client: Assistant, info: NotifyData) {
        super(client, info, 'weekly');
    }

    notify(): void {
        this.send(settings => weekly.embed(this, settings));
    }
}