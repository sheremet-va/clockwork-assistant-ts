// eslint-disable-next-line no-unused-vars
module.exports = async ( client, channel ) => {
    /* client.subs.forEach( ( sub, guildId ) => {
        const guild = client.guilds.get( guildId );

        if ( !guild ) {
            return client.subs.delete( guildId );
        }

        const subs = Object.keys( sub ).reduce( ( unsubscribedSubs, name ) => {
            const channels = sub[name].split( ',' );

            if ( channels.includes( channel.id ) ) {
                client.unsubscribeChannel( guildId, channel.id, name );
                unsubscribedSubs.push( name );
            }
            return unsubscribedSubs;
        }, []);
        if ( subs.length === 0 ) return;
        return client.logger.log( `[КАНАЛ УДАЛЁН] Канал «${channel.name}» (${channel.id}) из гильдии «${guild.name}» (${guild.id}) отписался от рассылки ${subs.join( ', ' )}.` );
    }); */
};