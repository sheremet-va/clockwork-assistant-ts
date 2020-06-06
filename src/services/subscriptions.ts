import { ErrorEmbed } from '../modules/error';
import { Subscriptions } from '../modules/subscriptions';

import * as fastify from 'fastify';

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

        client.logger.log(`Channel ${id} from '${guild.name}' was unsubed (actually in wasn't).`, 'unsub');
    });

    subscriptions.on('permissionError', async ({ permission, channel, guild }) => {
        const error = 'PERMISSION_SUBSCRIPTIONS_ERROR';
        const pathError = `/api/translations/errors/${error}?id=${guild.id}`;
        const pathNames = `/api/translations/subscriptions/permissions/${permission}?id=${guild.id}`;

        const { translations } = await client.request(pathError, null, '1.0');
        const { translations: name } = await client.request(pathNames, null, '1.0');

        const render = {
            guild: guild.name,
            channel: channel.name,
            permission: name
        };

        const embed = new ErrorEmbed(translations[error].render(render));

        if(!guild.owner) {
            return;
        }

        guild.owner.send(embed);
    });
}

async function post(
    client: Assistant,
    request: fastify.FastifyRequest,
    controller, // TODO
    name: string
): Promise<{ status: string }> {
    if (!request.body) {
        return;
    }

    const {
        translations,
        data,
        subscribers,
        settings
    } = request.body;

    if (!subscribers || !Object.keys(subscribers).length) {
        throw new Error('No subscribers recieved.');
    }

    if (!data || !Object.keys(data).length) {
        throw new Error('No data recieved.');
    }

    const subscriptions: Subscriptions = new controller(
        client,
        { translations, data, subscribers, settings },
        name
    );

    handle(client, subscriptions);

    return (
        (subscriptions.notify.constructor.name == 'AsyncFunction'
            ? await subscriptions.notify()
            : subscriptions.notify()) || { status: 'success' }
    );
}

function init(client: Assistant, subscriptions: { name: string; names: string[]; controller: Subscriptions }[]): void {
    subscriptions.forEach(({ controller, names }) =>
        names.forEach(name =>
            app.post('/subscriptions/' + name, async (request, reply) => {
                client.logger.log(
                    `Получен POST-запрос на /${name}`,
                    'req'
                );

                try {
                    return await post(client, request, controller, name);
                } catch (e) {
                    console.log(e);
                    client.logger.error(e.message);

                    // reply.code(500); hmmm

                    return { status: 'fail' };
                }
            }))
    );

    app.listen(PORT, () => client.logger.log(`Listening webhooks on ${PORT} port.`));
}

export { init };