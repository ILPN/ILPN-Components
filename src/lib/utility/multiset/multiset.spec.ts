import {incrementMultisetMultiplicity, cloneMultiset, Multiset} from './multiset';


describe('Multiset', () => {
    it('should increment', () => {
        const multiset: Multiset = {};
        incrementMultisetMultiplicity(multiset, 'a');
        expect(multiset['a']).toBe(1);
        incrementMultisetMultiplicity(multiset, 'a');
        expect(multiset['a']).toBe(2);
        incrementMultisetMultiplicity(multiset, 'b');
        expect(multiset['a']).toBe(2);
        expect(multiset['b']).toBe(1);
    });

    it('should clone', () => {
        const multiset: Multiset = {};
        incrementMultisetMultiplicity(multiset, 'a');
        expect(multiset['a']).toBe(1);
        const clone = cloneMultiset(multiset);
        expect(multiset !== clone).toBeTrue();
        incrementMultisetMultiplicity(clone, 'a');
        expect(multiset['a']).toBe(1);
        expect(clone['a']).toBe(2);
    });
});
