import * as objectHash from 'object-hash';
import {MultisetEquivalent} from './multiset-equivalent';
import {Multiset} from './multiset';


export class MultisetMap<T> {
    private _map: Map<string, Array<T & MultisetEquivalent>>;

    constructor() {
        this._map = new Map();
    }

    public put(value: T & MultisetEquivalent) {
        const hash = this.hashKey(value.multiset);
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

    public values(): Array<T & MultisetEquivalent> {
        return Array.from(this._map.values()).flat();
    }
}
