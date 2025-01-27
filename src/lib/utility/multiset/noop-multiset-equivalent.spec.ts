import {Multiset} from './multiset';
import {NoopMultisetEquivalent} from "./noop-multiset-equivalent";


describe('NoopMultisetEquivalent', () => {
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
        const eq = new NoopMultisetEquivalent(m1);
        expect(eq.equals(m1)).toBeTrue();
        expect(eq.equals(m2)).toBeTrue();
        expect(eq.equals(m3)).toBeFalse();
        expect(eq.equals(m4)).toBeFalse();
    });
});
