import { Guild } from 'discord.js';

function event(client: Assistant, guild: Guild): void {
    client.logger.log(`[GUILD LEFT] ${guild.name} (${guild.id}) left.`);

    // await client.guildCustomDelete( guild );
}

export { event };
