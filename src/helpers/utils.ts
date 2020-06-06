export declare type Translations = Record<string, string>;
export declare type SubsTranslations = Record<string, Translations>;

export declare type Complete<T> = {
    [K in keyof T]-?: T[K];
}

function translate(translations: Translations | string, language: string): string {
    if (typeof translations === 'string') {
        return translations;
    }

    return translations[language];
}

function notUndefined<T>(x: T | undefined): x is T {
    return x !== undefined;
}

export { translate, notUndefined };