import axios, { AxiosInstance, AxiosResponse } from 'axios';

import { config } from '../config';

function request(): AxiosInstance {
    const baseURL = config.core;

    return axios.create({
        baseURL,
        headers: {
            'Accept-Version': '1.0.0'
        }
    });
}

class StoreRequest {

    public async get<T = unknown>(key: string, path?: string): Promise<T> {
        const result = await request().get('/store/config/' + key + '?path=' + path);

        return result.data.data;
    }

    public async set(key: string, value: unknown, path?: string): Promise<unknown> {
        const data = { path, value };

        const result = await request().post('/store/config/' + key, data);

        return result.data.data;
    }

    private async update(key: string, value: unknown, action: string): Promise<AxiosResponse> {
        const data = { value };

        return request().post('/store/config/' + action + '/' + key, data);
    }

    public async remove(key: string, value: unknown): Promise<unknown> {
        const result = await this.update(key, value, 'remove');

        return result.data.data;
    }

    public async push(key: string, value: unknown): Promise<unknown> {
        const result = await this.update(key, value, 'push');

        return result.data.data;
    }
}

export type Lifecycle = [string, string, number]; // status, userID, timestamp

export type Order = {
    userID: string;
    products: {
        name: string;
        link: string;
        image: string;
        crown_price: number;
        gold_price: number;
        amount: number;
    }[];
    conversion: number;
    discount: number;
    crown_price: string;
    gold_price: string;
    name: string;
    guild: string;
    message: string;
    user: string;
    status: string;
    seller: null | string;
    sellerID: null | string;
    source: string;
    lifecycle: Lifecycle[];
    orderID: string;
}

class Store extends StoreRequest {
    private cache: Record<string, unknown> = {};

    private enableCache = [
        'managers',
        'discounts',
        'discount_status',
        'emojis',
        'conf',
        'messages'
    ];

    public async updateOrderStatus(orderID: string, status: string, userID: string): Promise<unknown> {
        const lifecycle = [status, userID, new Date().valueOf()];

        const result = await request().post('/store/orders/status', { order: { status, orderID }, lifecycle });

        return result.data.data;
    }

    public async updateOrder(order: Partial<Order>, status: string, userID: string): Promise<{ orderID: string }> {
        const data = {
            ...order,
            status
        };

        const lifecycle = [status, userID, new Date().valueOf()];

        const result = await request().post('/store/orders', { order: data, lifecycle });

        return result.data.data;
    }

    public async createOrder(order: Order): Promise<{ orderID: string }> {
        const { data } = await request().put('/store/orders', { order });

        return data.data;
    }

    public async getOrdersByUser(userID: string, filter?: { status: string }): Promise<Order[]> {
        const filterQuery = Object.entries(filter || {}).map(([code, name]) => `${code}=${name}`);

        const { data } = await request().get<{ data: Order[] }>('/store/orders/user/' + userID + '?' + filterQuery);

        return data.data;
    }

    public async getOrderById(orderID: string): Promise<Order | null> {
        try {
            const { data } = await request().get<{ data: Order }>('/store/orders/' + orderID);

            return data.data;
        } catch {
            return null;
        }
    }

    public async get(key: 'discount_status'): Promise<boolean>;
    public async get(key: 'emojis'): Promise<Record<string, string>>;
    public async get(key: 'discounts'): Promise<Record<string, string>>;
    public async get(key: 'managers'): Promise<string[]>;
    public async get(key: 'messages'): Promise<Record<string, string>>;
    public async get(key: 'messages', path: string): Promise<string>;
    public async get(key: 'conf'): Promise<Record<string, string | number>>;
    public async get(key: 'conf', path: string): Promise<string | number>;
    public async get<T = unknown>(key: string, path?: string): Promise<T> {
        if(this.cache[key]) {
            const value = this.cache[key];

            if(!path) {
                return value as T;
            } else if(typeof value === 'object' && value && Reflect.has(value, path)) {
                return Reflect.get(value, path);
            }
        }

        return super.get<T>(key, path);
    }

    public async set(key: string, value: unknown, path?: string): Promise<void> {
        const result = await super.set(key, value, path);

        if(this.enableCache.includes(key)) {
            this.cache[key] = result;
        }
    }
}

const store = new Store();

export { store };
