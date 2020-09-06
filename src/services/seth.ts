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

    app.get('/users', async(req, reply) => {
        if(!req.query.ids) {
            return reply.code(400);
        }

        const ids = (req.query.ids as string).split(',');

        return ids.map(id => {
            const user = client.users.cache.get(id);

            if(!user) {
                return false;
            }

            return { id: user.id, tag: user.tag, avatar: user.avatarURL() };
        }).filter(Boolean);
    });

    app.get('/users/:userId', async(req, reply) => {
        const userId = req.params.userId;

        const user = await client.users.fetch(userId);

        if(!user) {
            return reply.code(404);
        }

        const guilds = client.guilds.cache
            .filter((g) => g.members.cache.has(user.id))
            .map(g => ({
                name: g.name,
                memberCount: g.memberCount,
                id: g.id,
                icon: g.icon
            }));

        return {
            ...user.toJSON(),
            guilds
        };
    });

    app.listen(PORT, () => client.logger.log('Seth Listens ' + PORT + ' port'));
}
