import {TestBed} from "@angular/core/testing";
import {PetriNetParserService} from "../../models/pn/io/parser/petri-net-parser.service";
import {PetriNetIsomorphismService} from "../pn/isomorphism/petri-net-isomorphism.service";
import {LogToSequenceNetTransformerService, SequenceNetStructure} from "./log-to-sequence-net-transformer.service";
import {createMockTrace} from "../../utility/test/create-mock-trace";
import {Trace} from "../../models/log/model/trace";
import {Lifecycle} from "../../models/log/model/lifecycle";
import {LogSymbol} from "./model/log-symbol";


describe('LogToSequenceNetTransformerService', () => {
    let parserService: PetriNetParserService;
    let isomorphism: PetriNetIsomorphismService;
    let transformerService: LogToSequenceNetTransformerService;

    let mockLog: Array<Trace>;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        parserService = TestBed.inject(PetriNetParserService);
        isomorphism = TestBed.inject(PetriNetIsomorphismService);
        transformerService = TestBed.inject(LogToSequenceNetTransformerService);
        expect(parserService).toBeTruthy();
        expect(isomorphism).toBeTruthy();
        expect(transformerService).toBeTruthy();

        mockLog = [
            createMockTrace(
                {n: 'A', p: Lifecycle.START},
                {n: 'B', p: Lifecycle.START},
                {n: 'A', p: Lifecycle.COMPLETE},
                {n: 'B', p: Lifecycle.COMPLETE},
                {n: 'C', p: Lifecycle.START},
                {n: 'C', p: Lifecycle.COMPLETE},
            ),
            createMockTrace('A', 'B', 'C'),
            createMockTrace('A'),
            createMockTrace('A', 'C'),
            createMockTrace(),
        ];
    });

    it('should return an empty array for an empty trace', () => {
        const result = transformerService.transformToSequenceNets([createMockTrace()]);

        expect(result).toBeTruthy();
        expect(result.length).toBe(0);
    });

    it('should return a sequence net for each unique trace [no clean, no start stop, include prefixes] (default settings)', () => {
        const result = transformerService.transformToSequenceNets(mockLog);

        expect(result).toBeTruthy();
        expect(result.length).toBe(4);

        // A -> B -> A -> B -> C -> C
        let net = parserService.parse(`.type pn
.transitions
a1 A
a2 A
b1 B
b2 B
c1 C
c2 C
.places
1 1
2 0
3 0
4 0
5 0
6 0
7 0
.arcs
1 a1
a1 2
2 b1
b1 3
3 a2
a2 4
4 b2
b2 5
5 c1
c1 6
6 c2
c2 7`);
        expect(net).toBeDefined();
        expect(isomorphism.arePetriNetsIsomorphic(result[0], net!)).toBeTrue();

        // A -> B -> C
        net = parserService.parse(`.type pn
.transitions
a A
b B
c C
.places
1 1
2 0
3 0
4 0
.arcs
1 a
a 2
2 b
b 3
3 c
c 4`);
        expect(net).toBeDefined();
        expect(isomorphism.arePetriNetsIsomorphic(result[1], net!)).toBeTrue();

        // A
        net = parserService.parse(`.type pn
.transitions
a A
.places
1 1
2 0
.arcs
1 a
a 2`);
        expect(net).toBeDefined();
        expect(isomorphism.arePetriNetsIsomorphic(result[2], net!)).toBeTrue();

        // A -> C
        net = parserService.parse(`.type pn
.transitions
a A
c C
.places
1 1
2 0
3 0
.arcs
1 a
a 2
2 c
c 3`);
        expect(net).toBeDefined();
        expect(isomorphism.arePetriNetsIsomorphic(result[3], net!)).toBeTrue();
    });

    it('should return a sequence net for each unique trace [clean, no start stop, include prefixes]', () => {
        const result = transformerService.transformToSequenceNets(mockLog, {cleanLog: true});

        expect(result).toBeTruthy();
        expect(result.length).toBe(3);

        // A -> B -> C
        let net = parserService.parse(`.type pn
.transitions
a A
b B
c C
.places
1 1
2 0
3 0
4 0
.arcs
1 a
a 2
2 b
b 3
3 c
c 4`);
        expect(net).toBeDefined();
        expect(isomorphism.arePetriNetsIsomorphic(result[0], net!)).toBeTrue();

        // A
        net = parserService.parse(`.type pn
.transitions
a A
.places
1 1
2 0
.arcs
1 a
a 2`);
        expect(net).toBeDefined();
        expect(isomorphism.arePetriNetsIsomorphic(result[1], net!)).toBeTrue();

        // A -> C
        net = parserService.parse(`.type pn
.transitions
a A
c C
.places
1 1
2 0
3 0
.arcs
1 a
a 2
2 c
c 3`);
        expect(net).toBeDefined();
        expect(isomorphism.arePetriNetsIsomorphic(result[2], net!)).toBeTrue();
    });

    it('should return a sequence net for each unique trace [no clean, start stop, include prefixes]', () => {
        const result = transformerService.transformToSequenceNets(mockLog, {addStartStopEvent: true});

        expect(result).toBeTruthy();
        expect(result.length).toBe(4);

        // ▶ -> A -> B -> A -> B -> C -> C -> ■
        let net = parserService.parse(`.type pn
.transitions
i ${LogSymbol.START}
a1 A
a2 A
b1 B
b2 B
c1 C
c2 C
o ${LogSymbol.STOP}
.places
1 1
2 0
3 0
4 0
5 0
6 0
7 0
8 0
9 0
.arcs
1 i
i 8
8 a1
a1 2
2 b1
b1 3
3 a2
a2 4
4 b2
b2 5
5 c1
c1 6
6 c2
c2 7
7 o
o 9`);
        expect(net).toBeDefined();
        expect(isomorphism.arePetriNetsIsomorphic(result[0], net!)).toBeTrue();

        // ▶ -> A -> B -> C -> ■
        net = parserService.parse(`.type pn
.transitions
i ${LogSymbol.START}
a A
b B
c C
o ${LogSymbol.STOP}
.places
1 1
2 0
3 0
4 0
5 0
6 0
.arcs
1 i
i 5
5 a
a 2
2 b
b 3
3 c
c 4
4 o
o 6`);
        expect(net).toBeDefined();
        expect(isomorphism.arePetriNetsIsomorphic(result[1], net!)).toBeTrue();

        // ▶ -> A -> ■
        net = parserService.parse(`.type pn
.transitions
i ${LogSymbol.START}
a A
o ${LogSymbol.STOP}
.places
1 1
2 0
3 0
4 0
.arcs
1 i
i 3
3 a
a 2
2 o
o 4`);
        expect(net).toBeDefined();
        expect(isomorphism.arePetriNetsIsomorphic(result[2], net!)).toBeTrue();

        // ▶ -> A -> C -> ■
        net = parserService.parse(`.type pn
.transitions
i ${LogSymbol.START}
a A
c C
o ${LogSymbol.STOP}
.places
1 1
2 0
3 0
4 0
5 0
.arcs
1 i
i 4
4 a
a 2
2 c
c 3
3 o
o 5`);
        expect(net).toBeDefined();
        expect(isomorphism.arePetriNetsIsomorphic(result[3], net!)).toBeTrue();
    });

    it('should return a sequence net for each unique trace [no clean, no start stop, no prefixes]', () => {
        const result = transformerService.transformToSequenceNets(mockLog, {discardPrefixes: true});

        expect(result).toBeTruthy();
        expect(result.length).toBe(3);

        // A -> B -> A -> B -> C -> C
        let net = parserService.parse(`.type pn
.transitions
a1 A
a2 A
b1 B
b2 B
c1 C
c2 C
.places
1 1
2 0
3 0
4 0
5 0
6 0
7 0
.arcs
1 a1
a1 2
2 b1
b1 3
3 a2
a2 4
4 b2
b2 5
5 c1
c1 6
6 c2
c2 7`);
        expect(net).toBeDefined();
        expect(isomorphism.arePetriNetsIsomorphic(result[0], net!)).toBeTrue();

        // A -> B -> C
        net = parserService.parse(`.type pn
.transitions
a A
b B
c C
.places
1 1
2 0
3 0
4 0
.arcs
1 a
a 2
2 b
b 3
3 c
c 4`);
        expect(net).toBeDefined();
        expect(isomorphism.arePetriNetsIsomorphic(result[1], net!)).toBeTrue();

        // A -> C
        net = parserService.parse(`.type pn
.transitions
a A
c C
.places
1 1
2 0
3 0
.arcs
1 a
a 2
2 c
c 3`);
        expect(net).toBeDefined();
        expect(isomorphism.arePetriNetsIsomorphic(result[2], net!)).toBeTrue();
    });

    it('should return a sequence net for each unique trace [clean, no start stop, no prefixes]', () => {
        const result = transformerService.transformToSequenceNets(mockLog, {cleanLog: true, discardPrefixes: true});

        expect(result).toBeTruthy();
        expect(result.length).toBe(2);

        // A -> B -> C
        let net = parserService.parse(`.type pn
.transitions
a A
b B
c C
.places
1 1
2 0
3 0
4 0
.arcs
1 a
a 2
2 b
b 3
3 c
c 4`);
        expect(net).toBeDefined();
        expect(isomorphism.arePetriNetsIsomorphic(result[0], net!)).toBeTrue();

        // A -> C
        net = parserService.parse(`.type pn
.transitions
a A
c C
.places
1 1
2 0
3 0
.arcs
1 a
a 2
2 c
c 3`);
        expect(net).toBeDefined();
        expect(isomorphism.arePetriNetsIsomorphic(result[1], net!)).toBeTrue();
    });

    // TODO isomorphism check is too inefficient for this test. per-hand check passes
    xit('should return trace model [no clean, no start stop, include prefixes]', () => {
        const result = transformerService.transformToSequenceNets(mockLog, {traceAggregation: SequenceNetStructure.TRACE_MODEL});

        expect(result).toBeTruthy();
        expect(result.length).toBe(1);

        // an alternative between each trace joined on final states
        // A -> B -> A -> B -> C -> C
        // A -> B -> C
        // A
        // A -> C
        let net = parserService.parse(`.type pn
.transitions
a11 A
a12 A
b11 B
b12 B
c11 C
c12 C
a2 A
b2 B
c2 C
a3 A
a4 A
c4 C
.places
1 1
0 0
11 0
12 0
13 0
14 0
15 0
21 0
22 0
41 0
.arcs
1 a11
a11 11
11 b11
b11 12
12 a12
a12 13
13 b12
b12 14
14 c11
c11 15
15 c12
c12 0
1 a2
a2 21
21 b2
b2 22
22 c2
c2 0
1 a3
a3 0
1 a4
a4 41
41 c4
c4 0`);
        expect(net).toBeDefined();
        expect(isomorphism.arePetriNetsIsomorphic(result[0], net!)).toBeTrue();
    });

    it('should return trace model [clean, no start stop, include prefixes]', () => {
        const result = transformerService.transformToSequenceNets(mockLog, {traceAggregation: SequenceNetStructure.TRACE_MODEL, cleanLog: true});

        expect(result).toBeTruthy();
        expect(result.length).toBe(1);

        // an alternative between each trace joined on final states
        // A -> B -> C
        // A
        // A -> C
        let net = parserService.parse(`.type pn
.transitions
a2 A
b2 B
c2 C
a3 A
a4 A
c4 C
.places
1 1
0 0
21 0
22 0
41 0
.arcs
1 a2
a2 21
21 b2
b2 22
22 c2
c2 0
1 a3
a3 0
1 a4
a4 41
41 c4
c4 0`);
        expect(net).toBeDefined();
        expect(isomorphism.arePetriNetsIsomorphic(result[0], net!)).toBeTrue();
    });

    // TODO isomorphism check is too inefficient for this test. per-hand check passes
    xit('should return trace model [no clean, start stop, include prefixes]', () => {
        const result = transformerService.transformToSequenceNets(mockLog, {traceAggregation: SequenceNetStructure.TRACE_MODEL, addStartStopEvent: true});

        expect(result).toBeTruthy();
        expect(result.length).toBe(1);

        // an alternative between each trace joined on final states
        // ▶ -> A -> B -> A -> B -> C -> C -> ■
        // ▶ -> A -> B -> C -> ■
        // ▶ -> A -> ■
        // ▶ -> A -> C -> ■
        let net = parserService.parse(`.type pn
.transitions
a11 A
a12 A
b11 B
b12 B
c11 C
c12 C
i1 ${LogSymbol.START}
o1 ${LogSymbol.STOP}
a2 A
b2 B
c2 C
i2 ${LogSymbol.START}
o2 ${LogSymbol.STOP}
a3 A
i3 ${LogSymbol.START}
o3 ${LogSymbol.STOP}
a4 A
c4 C
i4 ${LogSymbol.START}
o4 ${LogSymbol.STOP}
.places
1 1
0 0
11 0
12 0
13 0
14 0
15 0
16 0
17 0
21 0
22 0
23 0
24 0
31 0
32 0
41 0
42 0
43 0
.arcs
1 i1
i1 16
16 a11
a11 11
11 b11
b11 12
12 a12
a12 13
13 b12
b12 14
14 c11
c11 15
15 c12
c12 17
17 o1
o1 0
1 i2
i2 23
23 a2
a2 21
21 b2
b2 22
22 c2
c2 24
24 o2
o2 0
1 i3
i3 31
31 a3
a3 32
32 o3
o3 0
1 i4
i4 42
42 a4
a4 41
41 c4
c4 43
43 o4
o4 0`);
        expect(net).toBeDefined();
        expect(isomorphism.arePetriNetsIsomorphic(result[0], net!)).toBeTrue();
    });

    // TODO isomorphism check is too inefficient for this test. per-hand check passes
    xit('should return trace model [no clean, no start stop, no prefixes]', () => {
        const result = transformerService.transformToSequenceNets(mockLog, {traceAggregation: SequenceNetStructure.TRACE_MODEL, discardPrefixes: true});

        expect(result).toBeTruthy();
        expect(result.length).toBe(1);

        // an alternative between each trace joined on final states
        // A -> B -> A -> B -> C -> C
        // A -> B -> C
        // A -> C
        let net = parserService.parse(`.type pn
.transitions
a11 A
a12 A
b11 B
b12 B
c11 C
c12 C
a2 A
b2 B
c2 C
a4 A
c4 C
.places
1 1
0 0
11 0
12 0
13 0
14 0
15 0
21 0
22 0
41 0
.arcs
1 a11
a11 11
11 b11
b11 12
12 a12
a12 13
13 b12
b12 14
14 c11
c11 15
15 c12
c12 0
1 a2
a2 21
21 b2
b2 22
22 c2
c2 0
1 a4
a4 41
41 c4
c4 0`);
        expect(net).toBeDefined();
        expect(isomorphism.arePetriNetsIsomorphic(result[0], net!)).toBeTrue();
    });

    it('should return trace model [clean, no start stop, no prefixes]', () => {
        const result = transformerService.transformToSequenceNets(mockLog, {traceAggregation: SequenceNetStructure.TRACE_MODEL, cleanLog: true, discardPrefixes: true});

        expect(result).toBeTruthy();
        expect(result.length).toBe(1);

        // an alternative between each trace joined on final states
        // A -> B -> C
        // A -> C
        let net = parserService.parse(`.type pn
.transitions
a2 A
b2 B
c2 C
a4 A
c4 C
.places
1 1
0 0
21 0
22 0
41 0
.arcs
1 a2
a2 21
21 b2
b2 22
22 c2
c2 0
1 a4
a4 41
41 c4
c4 0`);
        expect(net).toBeDefined();
        expect(isomorphism.arePetriNetsIsomorphic(result[0], net!)).toBeTrue();
    });
});
