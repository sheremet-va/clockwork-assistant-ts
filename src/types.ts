import { Message, User } from 'discord.js';
import { Settings } from './modules/subscriptions';

export interface AssistantUser extends User {
    permLevel: number;
    permLevelName: string;
}

export interface AssistantMessage extends Message {
    client: Assistant;
    name: string;
    settings: Settings & { prefix: string };
    subs: Record<string, string[]>;
    languages: string[];
    author: AssistantUser;
    args: string[];
    command: string;
    ownerId: string;
}

export declare interface RequestInfo {
    data?: any;
    translations?: any;
}

export declare interface Configuration {
    enabled: boolean;
    guildOnly: boolean;
    helpShown: boolean;
    permLevel: string;
    path?: string;
}

export declare type Command = {
    name: string;
    projects: string[];
    aliases: string[];
}

export declare type Item = Record<string, string>;

export declare type language = 'en' | 'ru';
