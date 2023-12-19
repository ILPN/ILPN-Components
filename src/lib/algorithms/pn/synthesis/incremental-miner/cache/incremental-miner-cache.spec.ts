import {IncrementalMinerCache} from './incremental-miner-cache';
import {PetriNet} from '../../../../../models/pn/model/petri-net';


describe('IncrementalMinerCache', () => {
    let cache: IncrementalMinerCache;
    const nets = {
        A: new PetriNet(),
        B: new PetriNet(),
        C: new PetriNet(),
        D: new PetriNet(),
    };
    const netsArr: Array<PetriNet> = [
        nets.A,
        nets.B,
        nets.C,
        nets.D
    ];

    beforeEach(() => {
        expect(netsArr.length).toBe(Object.keys(nets).length);
        cache = new IncrementalMinerCache(netsArr);
    });

    it('should create', () => {
        expect(cache).toBeTruthy();

        for (let i = 0; i < netsArr.length; i++) {
            const entry = cache.get([i]);

            expect(entry).toBeTruthy();
            expect(entry.key).toEqual([i]);
            expect(entry.value).toBe(netsArr[i]);
        }
    });

    it('should prioritise lower indices in subsets', () => {
        expect(cache).toBeTruthy();

        let entry = cache.get([0, 1]);
        expect(entry).toBeTruthy();
        expect(entry.key).toEqual([0]);
        expect(entry.value).toBe(nets.A);

        entry = cache.get([0, 2]);
        expect(entry).toBeTruthy();
        expect(entry.key).toEqual([0]);
        expect(entry.value).toBe(nets.A);

        entry = cache.get([1, 2]);
        expect(entry).toBeTruthy();
        expect(entry.key).toEqual([1]);
        expect(entry.value).toBe(nets.B);
    });

    it('should insert', () => {
        expect(cache).toBeTruthy();

        const net = new PetriNet();
        cache.put([0, 1], net);

        let entry = cache.get([0, 1]);
        expect(entry).toBeTruthy();
        expect(entry.key).toEqual([0, 1]);
        expect(entry.value).toBe(net);

        entry = cache.get([0, 2]);
        expect(entry).toBeTruthy();
        expect(entry.key).toEqual([0]);
        expect(entry.value).toBe(nets.A);

        entry = cache.get([0, 1, 2]);
        expect(entry).toBeTruthy();
        expect(entry.key).toEqual([0, 1]);
        expect(entry.value).toBe(net);
    });

    it('should prioritise lower indices in equal subsets', () => {
        expect(cache).toBeTruthy();

        const netLower = new PetriNet();
        cache.put([0, 1, 3], netLower);
        const netHigher = new PetriNet();
        cache.put([0, 2, 3], netHigher);

        let entry = cache.get([0, 1, 2, 3]);
        expect(entry).toBeTruthy();
        expect(entry.key).toEqual([0, 1, 3]);
        expect(entry.value).toBe(netLower);
    });

    it('should find larger subsets with higher indices', () => {
        expect(cache).toBeTruthy();

        const netSmaller = new PetriNet();
        cache.put([0, 1], netSmaller);
        const netLarger = new PetriNet();
        cache.put([1, 2, 3], netLarger);

        let entry = cache.get([0, 1, 2, 3]);
        expect(entry).toBeTruthy();
        expect(entry.key).toEqual([1, 2, 3]);
        expect(entry.value).toBe(netLarger);
    });

    it('should clear cache', () => {
        expect(cache).toBeTruthy();

        const netCombined = new PetriNet();
        cache.put([1,2], netCombined);

        let entry = cache.get([1,2]);
        expect(entry).toBeTruthy();
        expect(entry.value).toBe(netCombined);

        cache.clear();

        entry = cache.get([1,2]);
        expect(entry).toBeTruthy();
        expect(entry.value).not.toBe(netCombined);
        expect(entry.key).toEqual([1]);
        expect(entry.value).toBe(nets.B);
    });
});
