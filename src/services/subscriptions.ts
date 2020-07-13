import { ErrorEmbed } from '../modules/error';
import { Subscriptions, NotifyData } from '../modules/subscriptions';

import fastify from 'fastify';

const app = fastify();

const PORT = 3007;

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

    subscriptions.on('permissionError', async ({ permission, channel, guild }) => {
        if(!guild.owner) {
            return;
        }

        const error = 'PERMISSION_SUBSCRIPTIONS';
        const pathError = `/translations/errors/errors/${error}?id=${guild.id}`;
        const pathNames = `/translations/subscriptions/permissions/${permission}?id=${guild.id}`;

        const { translations: errorString } = await client.request(pathError, null, '1.0');
        const { translations: name } = await client.request(pathNames, null, '1.0');

        const render = {
            guild: guild.name,
            channel: channel.name,
            permission: name
        };

        const message = errorString;

        const embed = new ErrorEmbed(message.render(render));

        // TODO add catch
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
        throw new Error('No body recieved.');
    }

    if(request.body.token !== client.config.back) {
        throw new Error('Invalid token.');
    }

    const {
        translations,
        data,
        subscribers,
        settings
    } = request.body;

    client.logger.log(`[SUB] ${name} recieved.`);

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
                    client.logger.error('SubscriptionsError', e.message, e.stack);

                    // reply.code(500); // hmmm

                    return { status: 'fail' };
                }
            }))
    );

    app.listen(PORT, () => client.logger.log(`Listening webhooks on ${PORT} port.`));
}

export { init };