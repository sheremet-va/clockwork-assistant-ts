import { guildCreate } from '../modules/analytics';

import { Guild } from 'discord.js';

function event(client: Assistant, guild: Guild): void {
    // TODO слать овнеру сообщение

    const owner = (guild.owner || { user: { tag: 'Unknown' } }).user.tag;

    guildCreate(guild.id);

    client.logger.log(
        `[NEW GUILD] ${guild.name} (${guild.id}) invited the bot. The owner: ${owner}.`
    );
}

export { event };