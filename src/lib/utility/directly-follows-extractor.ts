import {MapSet} from './map-set';


export class DirectlyFollowsExtractor {
    private _directlyFollows: MapSet<string, string>;

    constructor() {
        this._directlyFollows = new MapSet<string, string>();
    }

    /**
     * Adds a pair to the directly follows relation.
     *
     * @param follows the event that directly follows the predecessor
     * @param predecessor
     */
    public add(follows: string, predecessor: string): void {
        this._directlyFollows.add(follows, predecessor);
    }

    /**
     * Extracts all pairs from the directly follows relation, that only appear in one direction.
     *
     * @returns an array of pairs, where the first element precedes the second element
     * and the two elements don't appear in the opposite order in the relation
     */
    public oneWayDirectlyFollows(): Array<[first: string, second: string]> {
        const oneWayDirectlyFollowsPairs: Array<[first: string, second: string]> = [];
        for (const entry of this._directlyFollows.entries()) {
            const second = entry[0];
            for (const first of entry[1]) {
                if (!this._directlyFollows.has(first, second)) {
                    oneWayDirectlyFollowsPairs.push([first, second]);
                }
            }
        }
        return oneWayDirectlyFollowsPairs;
    }
}
