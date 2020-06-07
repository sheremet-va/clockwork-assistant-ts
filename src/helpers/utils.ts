export declare type Translations = Record<string, string>;
export declare type SubsTranslations = Record<string, Translations>;

export declare type Complete<T> = {
    [K in keyof T]-?: T[K];
}

function translate(translations: Translations | string, language: string | undefined): string {
    if (typeof translations === 'string') {
        return translations;
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return translations[language!] || translations.en || '';
}

function notUndefined<T>(x: T | undefined): x is T {
    return x !== undefined;
}

function keys<O>(o: O): (keyof O)[] {
    return Object.keys(o) as (keyof O)[];
}

function entries<O>(o: O): ([keyof O, Exclude<O[keyof O], undefined>])[] {
    return Object.entries(o) as ([keyof O, Exclude<O[keyof O], undefined>])[];
}

export { translate, notUndefined, keys, entries };