import {Multiset} from './multiset';
import {MultisetEquivalent} from './multiset-equivalent';
import {MultisetMap} from './multiset-map';


describe('MultisetMap', () => {
    it('should put/get', () => {
        const map = new MultisetMap<ME>();
        expect(map.values().length).toBe(0);

        map.put(new ME({'a': 2, 'b': 1}, new Set<string>(['aab'])));
        expect(map.values().length).toBe(1);

        let v = map.get({'a': 2, 'b': 1});
        expect(v).toBeTruthy();
        expect(v!.strings.size).toBe(1)
        expect(v!.strings.has('aab')).toBeTrue();

        map.put(new ME({'a': 2, 'b': 1}, new Set<string>(['aba'])));
        expect(map.values().length).toBe(1);

        v = map.get({'a': 2, 'b': 1});
        expect(v).toBeTruthy();
        expect(v!.strings.size).toBe(2)
        expect(v!.strings.has('aab')).toBeTrue();
        expect(v!.strings.has('aba')).toBeTrue();

        map.put(new ME({'a': 1, 'b': 2}, new Set<string>(['abb'])));
        expect(map.values().length).toBe(2);
    });
});

class ME extends MultisetEquivalent {
    public strings: Set<string>;

    constructor(multiset: Multiset, strings: Set<string>) {
        super(multiset);
        this.strings = strings;
    }

    merge(ms: ME): void {
        for (const s of ms.strings) {
            this.strings.add(s);
        }
    }

}
