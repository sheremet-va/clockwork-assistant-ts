import fastify from 'fastify';
import { store } from '../modules/store';

const app = fastify();

const PORT = 3033;

export function init(client: Assistant): void {
    app.get('/seth/managers', async() => {
        const managers = store.get('managers') as string[];

        return {
            data: managers.map(name => name.split(':')[0])
        };
    });

    app.listen(PORT, () => client.logger.log('Seth Listens ' + PORT + ' port'));
}
