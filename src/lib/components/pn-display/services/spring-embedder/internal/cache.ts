export type Cache<T> = { [k: string]: { [k: string]: T | undefined } | undefined };
