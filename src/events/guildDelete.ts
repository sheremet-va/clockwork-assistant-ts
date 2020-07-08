import { guildDelete } from '../modules/analytics';

import { Guild } from 'discord.js';

export default (client: Assistant, guild: Guild): void => {
    client.logger.log(`[GUILD LEFT] ${guild.name} (${guild.id}) left.`);

    guildDelete(guild.id);

    // await client.guildCustomDelete( guild );
};
