import {TestBed} from '@angular/core/testing';
import {PetriNetReachabilityService} from './petri-net-reachability.service';
import {PetriNet} from "../../../models/pn/model/petri-net";
import {PetriNetParserService} from "../../../models/pn/parser/petri-net-parser.service";
import {MarkingWithEnabledTransitions} from "./model/marking-with-enabled-transitions";
import {Marking, Markinglike} from "../../../models/pn/model/marking";
import {Transition} from "../../../models/pn/model/transition";
import {createMockTrace} from "../../../utility/test/create-mock-trace";

describe('PetriNetReachabilityService', () => {
    let service: PetriNetReachabilityService;
    let net: PetriNet;

    const NET_TEXT = `.type pn
.transitions
a A
b B
c C
d D
x X
.places
p1 1
p2 0
p3 0
p4 0
p5 1
p6 0
p7 0
p8 0
.arcs
p1 a 1
a p2 1
a p3 2
a p4 1
p2 b 1
x p2 1
p3 x 1
p4 c 1
b p6 1
p6 x 1
x p5 1
p5 x 1
p5 c 1
c p7 1
p6 d 1
p7 d 1
d p8 1
`;

    const EXPECTED_ALL_REACHABLE_STATES = [
        expectedMarking({'p1': 1, 'p5': 1}, 'a'),
        expectedMarking({'p2': 1, 'p3': 2, 'p4': 1, 'p5': 1}, 'b', 'c'),
        expectedMarking({'p2': 1, 'p3': 2, 'p7': 1}, 'b'),
        expectedMarking({'p3': 2, 'p6': 1, 'p7': 1}, 'd'),
        expectedMarking({'p3': 2, 'p8': 1}),
        expectedMarking({'p3': 2, 'p4': 1, 'p5': 1, 'p6': 1}, 'x', 'c'),
        expectedMarking({'p2': 1, 'p3': 1, 'p4': 1, 'p5': 1}, 'b', 'c'),
        expectedMarking({'p2': 1, 'p3': 1, 'p7': 1}, 'b'),
        expectedMarking({'p3': 1, 'p6': 1, 'p7': 1}, 'd'),
        expectedMarking({'p3': 1, 'p8': 1}),
        expectedMarking({'p3': 1, 'p4': 1, 'p5': 1, 'p6': 1}, 'x', 'c'),
        expectedMarking({'p2': 1, 'p4': 1, 'p5': 1}, 'b', 'c'),
        expectedMarking({'p4': 1, 'p5': 1, 'p6': 1}, 'c'),
        expectedMarking({'p2': 1, 'p7': 1}, 'b'),
        expectedMarking({'p6': 1, 'p7': 1}, 'd'),
        expectedMarking({'p8': 1}),
    ];

    const EXPECTED_REACHABLE_BY_TRACES: Array<Markinglike> = [
        {'p1': 1, 'p5': 1},
        {'p2': 1, 'p3': 2, 'p4': 1, 'p5': 1},
        {'p3': 2, 'p4': 1, 'p5': 1, 'p6': 1},
        {'p2': 1, 'p3': 1, 'p4': 1, 'p5': 1},
        {'p2': 1, 'p3': 1, 'p7': 1},
        {'p3': 1, 'p4': 1, 'p5': 1, 'p6': 1},
        {'p3': 1, 'p6': 1, 'p7': 1},
        {'p3': 1, 'p8': 1},
    ];


    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(PetriNetReachabilityService);

        const parserService = TestBed.inject(PetriNetParserService);
        net = parserService.parse(NET_TEXT)!;
        expect(net).toBeDefined();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should get reachable markings', () => {
        expect(service).toBeTruthy();
        const reachable = service.getReachableMarkings(net);

        expect(reachable.length).toBe(EXPECTED_ALL_REACHABLE_STATES.length);
        for (const expected of EXPECTED_ALL_REACHABLE_STATES) {
            expect(reachable.some(m => m.equals(expected)));
        }
    });

    it('should get reachable markings by traces', () => {
        expect(service).toBeTruthy();

        const reachable = service.getMarkingsReachableByTraces(net, [
            createMockTrace('A', 'B', 'X', 'B', 'C', 'D'),
            createMockTrace('A', 'B', 'X', 'C', 'B', 'D'),
        ]);

        expect(reachable.length).toBe(EXPECTED_REACHABLE_BY_TRACES.length);
        for (const expected of EXPECTED_REACHABLE_BY_TRACES) {
            const em = new Marking(expected);
            expect(reachable.some(m => m.equals(em)));
        }
    });
});

function expectedMarking(marking: Markinglike, ...transitions: Array<string>): MarkingWithEnabledTransitions {
    const r = new MarkingWithEnabledTransitions(new Marking(marking));
    r.addEnabledTransitions(transitions.map(id => ({getId: () => id} as Transition)));
    return r;
}
