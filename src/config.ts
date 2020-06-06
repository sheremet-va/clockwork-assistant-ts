import { id as token, back } from './token.json';
import { PermissionString } from 'discord.js';

import { AssistantMessage as Message } from './types';

function checkPermission(name: PermissionString) {
    return (message: Message) => {
        if (!message.guild) {
            return true;
        }

        if (
            message.author &&
            message.channel.type === 'text' &&
            message.channel.permissionsFor(message.author)
        ) {
            return message.channel.permissionsFor(message.author).has(name, false);
        }

        return false;
    };
}

const config: config = {
    core: 'http://localhost:3006',
    ownerID: '215358861647806464',
    support: [],
    admins: [],
    token,
    back,

    defaultSettings: { prefix: '-' },

    permLevels: [
        {
            level: 0,
            name: 'User',
            check: () => true
        },

        {
            level: 2,
            name: 'Moderator',
            check: checkPermission('MANAGE_CHANNELS')
        },

        {
            level: 3,
            name: 'Admin',
            check: checkPermission('ADMINISTRATOR')
        },

        {
            level: 4,
            name: 'Server Owner',
            check: (message: Message) => {
                if (message.channel.type !== 'text') {
                    return false;
                }

                return message.guild.ownerID === message.author.id;
            }
        },

        {
            level: 8,
            name: 'Support',
            check: (message: Message) => config.support.includes(message.author.id)
        },

        {
            level: 9,
            name: 'Bot Admin',
            check: (message: Message) => config.admins.includes(message.author.id)
        },

        {
            level: 10,
            name: 'Bot Owner',
            check: (message: Message) => message.client.config.ownerID === message.author.id
        }
    ]
};

type config = {
    core: string;
    ownerID: string,
    support: string[],
    admins: string[],
    token: string,
    back: string,
    defaultSettings: { prefix: string };
    permLevels: { level: number; name: string; check: (m: Message) => boolean; guildOnly?: boolean }[];
};

export { config };
