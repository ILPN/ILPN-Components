import {filterUniqueTraces} from "./unique-traces";
import {createMockTrace} from "../../utility/test/create-mock-trace";
import {Trace} from "../../models/log/model/trace";


describe('filterUniqueTraces', () => {
    let traces: Array<Trace>;

    beforeEach(() => {
        traces = [
            createMockTrace('a', 'b', 'c'),
            createMockTrace('a', 'b'),
            createMockTrace('a', 'c'),
            createMockTrace('a', 'b', 'c'),
            createMockTrace('a'),
            createMockTrace('a', 'c', 'b'),
            createMockTrace('a', 'b'),
        ];
    });

    it('should filter unique traces', () => {
        const unique = filterUniqueTraces(traces);

        expect(unique.length).toBe(5);

        const abc = findTrace(unique, 'a', 'b', 'c');
        expect(abc).toBeDefined();
        expect(abc?.frequency).toBe(2);

        const acb = findTrace(unique, 'a', 'c', 'b');
        expect(acb).toBeDefined();
        expect(acb?.frequency).toBe(1);

        const ab = findTrace(unique, 'a', 'b');
        expect(ab).toBeDefined();
        expect(ab?.frequency).toBe(2);

        const ac = findTrace(unique, 'a', 'c');
        expect(ac).toBeDefined();
        expect(ac?.frequency).toBe(1);

        const a = findTrace(unique, 'a');
        expect(a).toBeDefined();
        expect(a?.frequency).toBe(1);
    });

    it('should discard prefixes', () => {
        const unique = filterUniqueTraces(traces, true);

        expect(unique.length).toBe(2);

        const abc = findTrace(unique, 'a', 'b', 'c');
        expect(abc).toBeDefined();
        expect(abc?.frequency).toBe(2);

        const acb = findTrace(unique, 'a', 'c', 'b');
        expect(acb).toBeDefined();
        expect(acb?.frequency).toBe(1);

        const ab = findTrace(unique, 'a', 'b');
        expect(ab).toBeUndefined();

        const ac = findTrace(unique, 'a', 'c');
        expect(ac).toBeUndefined();

        const a = findTrace(unique, 'a');
        expect(a).toBeUndefined();
    });
});

function findTrace(arr: Array<Trace>, ...trace: Array<string>): Trace | undefined {
    const searched = createMockTrace(...trace);
    return arr.find(t => t.equals(searched));
}
