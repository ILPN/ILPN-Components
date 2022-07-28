import {iterate} from './iterate';

export class MapSet<K, V> {
    private _map: Map<K, Set<V>>;

    constructor() {
        this._map = new Map<K, Set<V>>();
    }

    public add(key: K, value: V) {
        if (this._map.has(key)) {
            this._map.get(key)!.add(value);
        } else {
            this._map.set(key, new Set<V>([value]));
        }
    }

    public addAll(key: K, values: Iterable<V>) {
        if (this._map.has(key)) {
            const set = this._map.get(key)!;
            iterate(values, v => {
                set.add(v);
            });
        } else {
            this._map.set(key, new Set(values));
        }
    }

    public has(key: K, value: V) {
        return this._map.has(key) && this._map.get(key)!.has(value);
    }

    public get(key: K): Set<V> {
        const set = this._map.get(key);
        if (set === undefined) {
            return new Set<V>();
        }
        return set;
    }

    public entries(): IterableIterator<[K, Set<V>]> {
        return this._map.entries();
    }
}
