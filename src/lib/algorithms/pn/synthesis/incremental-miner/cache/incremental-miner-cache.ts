import {PetriNet} from '../../../../../models/pn/model/petri-net';
import {CacheEntry} from './cache-entry';


// TODO investigate adapting a set-trie from Savnik https://osebje.famnit.upr.si/~savnik/papers/cdares13.pdf
/**
 * A naive implementation of a cache with partially ordered keys
 */
export class IncrementalMinerCache {

    private readonly _domain: Array<PetriNet>;
    private readonly _cardinalities: Map<number, Array<CacheEntry>>;

    /**
     * Initializes a new cache. Sets containing a single element of the list (atoms) are mapped to the domain elements.
     * @param domain the list of elements, whose subsets can be used as keys
     */
    public constructor(domain: Array<PetriNet>) {
        this._domain = [...domain];
        this._cardinalities = new Map<number, Array<CacheEntry>>();

        const atoms: Array<CacheEntry> = [];
        for (let i = 0; i < this._domain.length; i++) {
            atoms.push({key: new Set<number>([i]), value: this._domain[i]});
        }
        this._cardinalities.set(1, atoms);
    }

    /**
     * Saves a new entry into the cache
     * @param key a set of indices of the `domain`
     * @param value the associated value
     */
    public put(key: Set<number>, value: PetriNet) {
        // TODO check if the entry already exists
        if (key.size === 1) {
            return;
        }

        const entries = this._cardinalities.get(key.size);
        if (entries === undefined) {
            this._cardinalities.set(key.size, [{key, value}]);
        } else {
            entries.push({key, value});
        }
    }

    /**
     * @param key a set of indices of the `domain`
     * @returns a cache entry. The `key` of the returned entry is the largest subset of the argument key, that is stored in the cache
     */
    public get(key: Set<number>): CacheEntry {

        const missingIndicesSet = new Set<number>();
        const missingIndices: Array<number> = [];

        for (let cardinality = key.size; cardinality > 0; cardinality--) {
            const entries = this._cardinalities.get(cardinality);
            if (entries === undefined) {
                continue;
            }

            for (const entry of entries) {
                if (missingIndicesSet.size < cardinality) {
                    if (missingIndices.some(i => entry.key.has(i))) {
                        continue;
                    }
                }

                let found = true;
                for (const index of entry.key.values()) {
                    if (key.has(index)) {
                        continue;
                    }

                    if (missingIndicesSet.size < cardinality && !missingIndicesSet.has(index)) {
                        missingIndicesSet.add(index);
                        missingIndices.push(index);
                    }
                    found = false;
                    break;
                }

                if (found) {
                    return entry;
                }
            }
        }
        throw new Error('unreachable');
    }
}
