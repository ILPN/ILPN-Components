import {MultisetEquivalent} from "./multiset-equivalent";
import {Multiset} from "./multiset";

export class NoopMultisetEquivalent extends MultisetEquivalent {

    constructor(multiset: Multiset) {
        super(multiset);
    }

    merge(ms: MultisetEquivalent): void {
    }

}
