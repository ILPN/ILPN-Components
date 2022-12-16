import {addToMultiset, cloneMultiset, Multiset} from './multiset';


describe('Multiset', () => {
    it('should add', () => {
        const multiset: Multiset = {};
        addToMultiset(multiset, 'a');
        expect(multiset['a']).toBe(1);
        addToMultiset(multiset, 'a');
        expect(multiset['a']).toBe(2);
        addToMultiset(multiset, 'b');
        expect(multiset['a']).toBe(2);
        expect(multiset['b']).toBe(1);
    });

    it('should clone', () => {
        const multiset: Multiset = {};
        addToMultiset(multiset, 'a');
        expect(multiset['a']).toBe(1);
        const clone = cloneMultiset(multiset);
        expect(multiset !== clone).toBeTrue();
        addToMultiset(clone, 'a');
        expect(multiset['a']).toBe(1);
        expect(clone['a']).toBe(2);
    });
});
