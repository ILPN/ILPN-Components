import {Multiset} from './multiset';


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
