import fastify from 'fastify';
import { store } from '../modules/store';

const app = fastify();

const PORT = 3033;

export function init(client: Assistant): void {
    app.get('/managers', async() => {
        const managers = store.get('managers') as string[];

        return managers.map(name => name.split(':')[0]);
    });

    app.get('/guilds', async() => {
        return client.guilds.cache.map(guild => ({
            id: guild.id,
            ownerID: guild.ownerID,
            name: guild.name,
            icon: guild.iconURL(),
            memberCount: guild.memberCount,
            region: guild.region
        }));
    });

    app.get('/guilds/:guildId', async(req, reply) => {
        const guildId = req.params.guildId;

        const guild = client.guilds.cache.get(guildId);

        if(!guild) {
            return reply.code(404);
        }

        return guild.toJSON();
    });

    app.listen(PORT, () => client.logger.log('Seth Listens ' + PORT + ' port'));
}
