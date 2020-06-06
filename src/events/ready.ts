import * as activity from '../helpers/activity';

export default (client: Assistant): void => {
    client.logger.log(
        `${(client.user || { tag: 'Assistant' }).tag} hosts ${client.users.cache.size} users in ${client.guilds.cache.size} guilds.`,
        'ready'
    );

    activity.random(client);
};
