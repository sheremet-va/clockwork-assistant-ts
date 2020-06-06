exports.run = async ( client, message, info, args ) => { // eslint-disable-line no-unused-vars
    const replace = client.translateCategory( 'errors', message.guild.id );

    console.log( replace );
};

exports.conf = {
    enabled: true,
    guildOnly: true,
    helpShown: false,
    aliases: ['когда'],
    permLevel: 'Администратор бота'
};