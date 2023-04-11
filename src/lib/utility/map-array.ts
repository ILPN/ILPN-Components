export class MapArray<K, V> {
    private _map: Map<K, Array<V>>;

    constructor() {
        this._map = new Map<K, Array<V>>();
    }

    public push(key: K, value: V) {
        if (this._map.has(key)) {
            this._map.get(key)!.push(value);
        } else {
            this._map.set(key, [value]);
        }
    }

    public get(key: K): Array<V> {
        const array = this._map.get(key);
        if (array === undefined) {
            return [];
        }
        return array;
    }

    public entries(): IterableIterator<[K, Array<V>]> {
        return this._map.entries();
    }

    public clear(): void {
        this._map.clear();
    }
}
