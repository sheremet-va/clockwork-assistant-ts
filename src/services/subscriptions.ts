import { ErrorEmbed } from '../modules/error';
import { Subscriptions, NotifyData } from '../modules/subscriptions';

import * as fastify from 'fastify';

const app = fastify();

const PORT = 3007;

const CACHED = {
    ru: {},
    en: {}
} as Record<'ru' | 'en', Record<string, string>>;

function handle(client: Assistant, subscriptions: Subscriptions): void {
    subscriptions.on('referenceError', async function (this: Subscriptions, { id, guild }) {
        const options = {
            url: `/subscriptions/unsub?id=${guild.id}`,
            method: 'POST' as const,
            data: {
                name: this.name.toLowerCase(),
                channelId: id,
                subject: 'Empty Channel'
            },
            headers: {
                'Content-Type': 'application/json',
            }
        };

        await client.request(options, null, '1.0');

        client.logger.log(`Channel ${id} from '${guild.name}' was unsubed (actually in wasn't).`);
    });

    subscriptions.on('permissionError', async ({ permission, channel, guild, settings }) => {
        if(!guild.owner) {
            return;
        }

        const error = 'PERMISSION_SUBSCRIPTIONS';
        const pathError = `/translations/errors/errors/${error}?id=${guild.id}`;
        const pathNames = `/translations/subscriptions/permissions/${permission}?id=${guild.id}`;

        const cached = CACHED[settings.language];

        const { translations: errorString } = (error in cached ? { translations: cached[error] } : await client.request(pathError, null, '1.0'));
        const { translations: name } = (permission in cached ? { translations: cached[permission] } : await client.request(pathNames, null, '1.0'));

        const render = {
            guild: guild.name,
            channel: channel.name,
            permission: name
        };

        cached[permission] = name;

        const message = cached[error] = errorString;

        const embed = new ErrorEmbed(message.render(render));

        guild.owner.send(embed);
    });
}

interface SubConstructor {
    new(client: Assistant, info: NotifyData, name: string): SubController;
}

interface SubController extends Subscriptions {
    notify(): Promise<void>;
}

async function post(
    client: Assistant,
    request: fastify.FastifyRequest,
    controller: SubConstructor, // TODO
    name: string
): Promise<{ status: string }> {
    if (!request.body) {
        return { status: 'fail' };
    }

    const {
        translations,
        data,
        subscribers,
        settings
    } = request.body;

    console.dir(request.body, {depth: null});

    if (!subscribers || !Object.keys(subscribers).length) {
        throw new Error('No subscribers recieved.');
    }

    if (!data || !Object.keys(data).length) {
        throw new Error('No data recieved.');
    }

    const subscriptions = new controller(
        client,
        { translations, data, subscribers, settings },
        name
    );

    handle(client, subscriptions);

    await subscriptions.notify();

    return { status: 'success' };
}

function init(
    client: Assistant,
    subscriptions: { name: string; names: string[]; controller: SubConstructor }[]
): void {

    subscriptions.forEach(({ controller, names }) =>
        names.forEach(name =>
            app.post('/subscriptions/' + name, async (request, _reply) => {
                client.logger.log(`Получен POST-запрос на /${name}`);

                try {
                    return await post(client, request, controller, name);
                } catch (e) {
                    console.log(e);
                    client.logger.error(e.message);

                    // reply.code(500); // hmmm

                    return { status: 'fail' };
                }
            }))
    );

    app.listen(PORT, () => client.logger.log(`Listening webhooks on ${PORT} port.`));
}

export { init };