import {MultisetEquivalentTraces} from './multiset-equivalent-traces';
import {createMockTrace} from '../test/create-mock-trace';


describe('MultisetEquivalentTraces', () => {
    it('should increment', () => {
        const met = new MultisetEquivalentTraces({});
        expect(met.count).toBe(0);
        met.incrementCount();
        expect(met.count).toBe(1);
        expect(met.traces).toBeTruthy();
        expect(met.traces.length).toBe(0);
        met.addTrace(createMockTrace([{n: 'a'}, {n: 'b'}]));
        expect(met.count).toBe(2);
        expect(met.traces.length).toBe(1);
    });

    it('should merge', () => {
        const met1 = new MultisetEquivalentTraces({});
        const t1 = createMockTrace([{n: 'a'}]);
        met1.addTrace(t1);
        const met2 = new MultisetEquivalentTraces({});
        const t2 = createMockTrace([{n: 'b'}]);
        met2.addTrace(t2);
        expect(met1.traces).toBeTruthy();
        expect(met1.traces.length).toBe(1);
        met1.merge(met2);
        expect(met1.traces.length).toBe(2);
        expect(t1 !== t2).toBeTrue();
        expect(met1.traces.some(t => t === t1)).toBeTrue();
        expect(met1.traces.some(t => t === t2)).toBeTrue();
    });
});
