import {TraceMultisetEquivalentStateTraverser} from './trace-multiset-equivalent-state-traverser';
import {createMockTrace} from '../test/create-mock-trace';


describe('TraceMultisetEquivalentStateTraverser', () => {
    it('should traverse states correctly', () => {
        const traverser = new TraceMultisetEquivalentStateTraverser();
        const outputs: Array<string> = [];
        traverser.traverseMultisetEquivalentStates([
            createMockTrace('a', 'a', 'b'),
            createMockTrace('a', 'b', 'a'),
            createMockTrace('b', 'a', 'a'),
        ],(prefix, step) => {
            outputs.push(step);
        });
        expect(outputs).toEqual(['a', 'a', 'b', 'b', 'a', 'b', 'a']);
    });

    it('should return correct set of multiset equivalent traces', () => {
        const traverser = new TraceMultisetEquivalentStateTraverser();
        const t1 = createMockTrace('a', 'a', 'b');
        const t2 = createMockTrace('a', 'b', 'a');
        const t3 = createMockTrace('b', 'a', 'a');
        const result = traverser.traverseMultisetEquivalentStates([t1, t2, t3]);
        expect(result).toBeTruthy();
        expect(result.length).toBe(1);
        expect(result[0].count).toBe(3);
        expect(result[0].traces.length).toBe(3);
        expect(result[0].traces.some(t => t.equals(t1))).toBeTrue();
        expect(result[0].traces.some(t => t.equals(t2))).toBeTrue();
        expect(result[0].traces.some(t => t.equals(t3))).toBeTrue();
    });
});
