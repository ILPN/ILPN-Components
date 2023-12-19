import {getByKeyId, Identifiable} from "./identifiable";

export class BidirectionalMap<A extends Identifiable, B extends Identifiable> {

    private readonly _map: Map<string, B>;
    private readonly _inverseMap: Map<string, A>;

    constructor() {
        this._map = new Map<string, B>();
        this._inverseMap = new Map<string, A>();
    }

    public set(a: A, b: B) {
        this._map.set(a.getId(), b);
        this._inverseMap.set(b.getId(), a);
    }

    public get(a: A | string) {
        return getByKeyId(this._map, a);
    }

    public getInverse(b: B | string) {
        return getByKeyId(this._inverseMap, b);
    }

    public getId(a: A | string) {
        return this.get(a)?.getId();
    }

    public getInverseId(b: B | string) {
        return this.getInverse(b)?.getId();
    }
}
