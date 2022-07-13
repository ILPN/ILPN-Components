import * as objectHash from 'object-hash';

export type Multiset = {[k: string]: number};

export abstract class MultisetEquivalent {

    protected constructor(private _multiset: Multiset) {
    }

    get multiset(): Multiset {
        return this._multiset;
    }

    equals(ms: Multiset): boolean {
        const keys = Object.keys(this._multiset);
        if (keys.length !== Object.keys(ms).length) {
            return false;
        }

        for (const key of keys) {
            if (this._multiset[key] !== ms[key]) {
                return false;
            }
        }

        return true;
    }

    abstract merge(ms: MultisetEquivalent): void;
}

export class MultisetMap<T> {
    private _map: Map<string, Array<T & MultisetEquivalent>>;

    constructor() {
        this._map = new Map();
    }

    public put(key: Multiset, value: T & MultisetEquivalent) {
        const hash = this.hashKey(key);
        const mapped = this._map.get(hash);
        if (mapped === undefined) {
            this._map.set(hash, [value]);
        } else {
            const equivalent = mapped.find(ms => ms.equals(value.multiset))
            if (equivalent === undefined) {
                mapped.push(value);
            } else {
                equivalent.merge(value);
            }
        }
    }

    public get(key: Multiset): (T & MultisetEquivalent) | undefined {
        const mapped = this._map.get(this.hashKey(key));
        if (mapped === undefined) {
            return undefined;
        }
        return mapped.find(ms => ms.equals(key));
    }

    private hashKey(key: Multiset): string {
        return objectHash.sha1(key);
    }
}
