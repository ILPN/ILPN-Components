import {Multiset} from './multiset';
import {MultisetEquivalent} from './multiset-equivalent';


describe('MultisetEquivalent', () => {
    it('should check equality', () => {
        const m1: Multiset = {
            'a': 1,
            'b': 2
        };
        const m2: Multiset = {
            'a': 1,
            'b': 2
        };
        const m3: Multiset = {
            'a': 1
        };
        const m4: Multiset = {
            'a': 2,
            'b': 1
        };
        const eq = new ME(m1);
        expect(eq.equals(m1)).toBeTrue();
        expect(eq.equals(m2)).toBeTrue();
        expect(eq.equals(m3)).toBeFalse();
        expect(eq.equals(m4)).toBeFalse();
    });
});

class ME extends MultisetEquivalent {

    constructor(multiset: Multiset) {
        super(multiset);
    }

    merge(ms: MultisetEquivalent): void {
    }

}
