// TODO пробрасывать через process.env

import { token, coreToken, dealers } from './configs.json';
import { PermissionString } from 'discord.js';

import { AssistantMessage } from './types';

function checkPermission(name: PermissionString) {
    return (message: AssistantMessage): boolean => {
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

const config: Config = {
    core: 'http://localhost:3006',
    ownerID: '215358861647806464',
    support: [],
    admins: [],
    token,
    coreToken,

    supportChannel: '752154861818085490',

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
            ['784740980704149534', 100000, 15], // Two Moons Dancer
            ['784767784487485450', 200000, 20], // Lunar Champion
            ['716601644699090944', 500000, 25], // Sweetroll
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
            check: (message: AssistantMessage): boolean => {
                if (message.channel.type !== 'text') {
                    return false;
                }

                return (message.guild || { ownerID: 0 }).ownerID === message.author.id;
            }
        },

        {
            level: 8,
            name: 'Bot Support',
            check: (message: AssistantMessage): boolean => config.support.includes(message.author.id)
        },

        {
            level: 9,
            name: 'Bot Admin',
            check: (message: AssistantMessage): boolean => config.admins.includes(message.author.id)
        },

        {
            level: 10,
            name: 'Bot Owner',
            check: (message: AssistantMessage): boolean => message.client.config.ownerID === message.author.id
        }
    ]
};

type Config = {
    core: string;
    ownerID: string;
    support: string[];
    admins: string[];
    token: string;
    coreToken: string;
    defaultSettings: { prefix: string };
    permLevels: { level: number; name: string; check: (m: AssistantMessage) => boolean; guildOnly?: boolean }[];
    dealers: {
        managerChannelID: string;
        ordersDoneChannelID: string;
        guildID: string;
        roles: [string, number, number][];
    };
    supportChannel: string;
};

export { config, Config };
