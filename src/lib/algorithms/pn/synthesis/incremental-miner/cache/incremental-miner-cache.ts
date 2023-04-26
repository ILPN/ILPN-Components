import {PetriNet} from '../../../../../models/pn/model/petri-net';
import {CacheEntry} from './cache-entry';
import {CacheTrieNode} from './cache-trie-node';


interface DfsStackFrame {
    node: CacheTrieNode,
    keyIndex: number,
    potentialCardinality: number,
    keyElement?: number,
    previousFrame?: DfsStackFrame,
}


/**
 * A cache with partially ordered keys represented by a set-trie based on Savnik https://osebje.famnit.upr.si/~savnik/papers/cdares13.pdf
 */
export class IncrementalMinerCache {

    private readonly _domain: Array<PetriNet>;
    private _root: CacheTrieNode;

    /**
     * Initializes a new cache. Sets containing a single element of the list (atoms) are mapped to the domain elements.
     * @param domain the list of elements, whose subsets can be used as keys
     */
    public constructor(domain: Array<PetriNet>) {
        this._domain = [...domain];
        this._root = new CacheTrieNode();
        this.populateCacheWithDomain();
    }

    /**
     * Saves a new entry into the cache
     * @param key a sorted array of indices of the `domain`
     * @param value the associated value
     */
    public put(key: Array<number>, value: PetriNet) {
        this._root.insertChild(key, value);
    }

    /**
     * @param key a sorted array of indices of the `domain`
     * @returns a cache entry. The `key` of the returned entry is the largest subset of the argument key, that is stored in the cache
     */
    public get(key: Array<number>): CacheEntry {

        // DFS of the trie, with early break if a better result was found already
        const dfsStack: Array<DfsStackFrame> = [{
            node: this._root,
            keyIndex: 0,
            potentialCardinality: 0
        }];

        let bestResult: DfsStackFrame;
        let bestCardinality = -1;

        while (dfsStack.length > 0) {
            const frame = dfsStack.pop()!;
            if (frame.potentialCardinality <= bestCardinality) {
                continue;
            }

            const node = frame.node;
            if (node.getCardinality() > bestCardinality) {
                bestResult = frame;
                bestCardinality = node.getCardinality();
            }

            for (let keyElementIndex = key.length - 1; keyElementIndex >= frame.keyIndex; keyElementIndex--) {
                const keyElement = key[keyElementIndex];

                if (!node.hasChild(keyElement)) {
                    continue;
                }

                const childNode = node.getChild(keyElement);
                dfsStack.push({
                    node: childNode,
                    keyIndex: keyElementIndex,
                    potentialCardinality: node.getPotentialCardinality(keyElement),
                    keyElement,
                    previousFrame: frame
                });
            }
        }

        return {
            key: this.reconstructKey(bestResult!),
            value: bestResult!.node.net!
        };
    }

    private reconstructKey(frame: DfsStackFrame): Array<number> {
        const r: Array<number> = [];
        while (frame.previousFrame !== undefined) {
            r.unshift(frame.keyElement!);
            frame = frame.previousFrame;
        }
        return r;
    }

    public clear() {
        this._root = new CacheTrieNode();
        this.populateCacheWithDomain();
    }

    private populateCacheWithDomain() {
        for (let i = 0; i < this._domain.length; i++) {
            this._root.insertChild([i], this._domain[i]);
        }
    }
}
