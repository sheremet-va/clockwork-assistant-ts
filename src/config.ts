import { id as token, back, dealers } from './configs.json';
import { PermissionString } from 'discord.js';

import { AssistantMessage as Message } from './types';

function checkPermission(name: PermissionString) {
    return (message: Message): boolean => {
        if (!message.guild) {
            return true;
        }

        if(message.channel.type !== 'text') {
            return false;
        }

        const permissions = message.channel.permissionsFor(message.author);

        if (message.author && permissions) {
            return permissions.has(name, false);
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

    dealers: {
        guildID: dealers.guildID,
        managerChannelID: dealers.managerChannelID,
        ordersDoneChannelID: dealers.ordersDoneChannelID,
        roles: [
            // [roleID, limit, discount]
            ['711357821827940412', 10000, 2], // alfiq
            ['711360072533540954', 20000, 4], // cathay-raht
            ['711359823492415538', 30000, 5], // Senche-Raht
            ['711360059132739656', 45000, 7], // Adept Of Alkosh
            ['711358952818081833', 70000, 10], // New Moon Priest
            ['716601644699090944', 500000, 15], // Sweetroll
        ]
    },

    permLevels: [
        {
            level: 0,
            name: 'User',
            check: (): true => true
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
            check: (message: Message): boolean => {
                if (message.channel.type !== 'text') {
                    return false;
                }

                return (message.guild || { ownerID: 0 }).ownerID === message.author.id;
            }
        },

        {
            level: 8,
            name: 'Bot Support',
            check: (message: Message): boolean => config.support.includes(message.author.id)
        },

        {
            level: 9,
            name: 'Bot Admin',
            check: (message: Message): boolean => config.admins.includes(message.author.id)
        },

        {
            level: 10,
            name: 'Bot Owner',
            check: (message: Message): boolean => message.client.config.ownerID === message.author.id
        }
    ]
};

type config = {
    core: string;
    ownerID: string;
    support: string[];
    admins: string[];
    token: string;
    back: string;
    defaultSettings: { prefix: string };
    permLevels: { level: number; name: string; check: (m: Message) => boolean; guildOnly?: boolean }[];
    dealers: {
        managerChannelID: string;
        ordersDoneChannelID: string;
        guildID: string;
        roles: [string, number, number][];
    };
};

export { config };
