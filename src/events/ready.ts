import * as activity from '../helpers/activity';

function event(client: Assistant): void {
    const botUser = client.user || { tag: 'Assistant' };

    client.logger.log(
        `${botUser.tag} hosts ${client.users.cache.size} users in ${client.guilds.cache.size} guilds.`
    );

    activity.random(client);
}

export { event };
