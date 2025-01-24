import {PetriNetParserService} from "../../../../models/pn/io/petri-net-parser.service";
import {TestBed} from "@angular/core/testing";
import {PetriNetRegionSynthesiser} from "./petri-net-region-synthesiser";
import {Flow} from "./flow";
import {PetriNet} from "../../../../models/pn/model/petri-net";
import {PetriNetRegion} from "./petri-net-region";
import {PetriNetIsomorphismService} from "../../isomorphism/petri-net-isomorphism.service";
import {Marking} from "../../../../models/pn/model/marking";
import {Multiset} from "../../../../utility/multiset/multiset";


describe('PetriNetRegionSynthesiser', () => {
    let parserService: PetriNetParserService;
    let isomorphismService: PetriNetIsomorphismService;
    let synthesiser: PetriNetRegionSynthesiser;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        parserService = TestBed.inject(PetriNetParserService);
        expect(parserService).toBeTruthy();
        isomorphismService = TestBed.inject(PetriNetIsomorphismService);
        expect(isomorphismService).toBeTruthy();

        synthesiser = new PetriNetRegionSynthesiser();
        expect(synthesiser).toBeTruthy();
    });

    it('should synthesise ingoing arc', () => {
        const net = parserService.parse(`.type pn
.transitions
a A
.places
1 0
.arcs
1 a`)!;
        expect(net).toBeTruthy();

        synthesiser.addRegion(mockRegion(net, {'1': 1}, {'A': {inflow: 1, outflow: 0}}));

        const result = synthesiser.synthesise();
        expect(result).toBeTruthy();
        expect(isomorphismService.arePetriNetsIsomorphic(result,net)).toBeTrue();
    });

    it('should synthesise outgoing arc', () => {
        const net = parserService.parse(`.type pn
.transitions
a A
.places
1 0
.arcs
a 1`)!;
        expect(net).toBeTruthy();

        synthesiser.addRegion(mockRegion(net, {'1': 1}, {'A': {inflow: 0, outflow: 1}}));

        const result = synthesiser.synthesise();
        expect(result).toBeTruthy();
        expect(isomorphismService.arePetriNetsIsomorphic(result,net)).toBeTrue();
    });

    it('should synthesise multiple arcs', () => {
        const net = parserService.parse(`.type pn
.transitions
a A
.places
1 0
2 0
.arcs
1 a
a 2`)!;
        expect(net).toBeTruthy();

        synthesiser.addRegion(mockRegion(net, {'2': 1}, {'A': {inflow: 0, outflow: 1}}));
        synthesiser.addRegion(mockRegion(net, {'1': 1}, {'A': {inflow: 1, outflow: 0}}));

        const result = synthesiser.synthesise();
        expect(result).toBeTruthy();
        expect(isomorphismService.arePetriNetsIsomorphic(result,net)).toBeTrue();
    });

    it('should not synthesise duplicate places', () => {
        const net = parserService.parse(`.type pn
.transitions
a A
.places
1 0
.arcs
1 a`)!;
        expect(net).toBeTruthy();

        synthesiser.addRegion(mockRegion(net, {'1': 1}, {'A': {inflow: 1, outflow: 0}}));
        synthesiser.addRegion(mockRegion(net, {'1': 1}, {'A': {inflow: 1, outflow: 0}}));

        const result = synthesiser.synthesise();
        expect(result).toBeTruthy();
        expect(isomorphismService.arePetriNetsIsomorphic(result,net)).toBeTrue();
    });

    it('should synthesise xor split', () => {
        const net = parserService.parse(`.type pn
.transitions
a A
b B
.places
1 0
.arcs
1 a
1 b`)!;
        expect(net).toBeTruthy();

        synthesiser.addRegion(mockRegion(net, {'1': 1}, {'A': {inflow: 1, outflow: 0},'B': {inflow: 1, outflow: 0}}));

        const result = synthesiser.synthesise();
        expect(result).toBeTruthy();
        expect(isomorphismService.arePetriNetsIsomorphic(result,net)).toBeTrue();
    });

    it('should synthesise xor join', () => {
        const net = parserService.parse(`.type pn
.transitions
a A
b B
.places
1 0
.arcs
a 1
b 1`)!;
        expect(net).toBeTruthy();

        synthesiser.addRegion(mockRegion(net, {'1': 1}, {'A': {inflow: 0, outflow: 1}, 'B': {inflow: 0, outflow: 1}}));

        const result = synthesiser.synthesise();
        expect(result).toBeTruthy();
        expect(isomorphismService.arePetriNetsIsomorphic(result,net)).toBeTrue();
    });

    it('should synthesise ingoing arc weight', () => {
        const net = parserService.parse(`.type pn
.transitions
a A
.places
1 0
.arcs
1 a`)!;
        expect(net).toBeTruthy();

        synthesiser.addRegion(mockRegion(net, {'1': 2}, {'A': {inflow: 2, outflow: 0}}));

        const result = synthesiser.synthesise();
        expect(result).toBeTruthy();

        const expected = parserService.parse(`.type pn
.transitions
a A
.places
1 0
.arcs
1 a 2`)!;
        expect(expected).toBeTruthy();

        expect(isomorphismService.arePetriNetsIsomorphic(result,expected)).toBeTrue();
    });

    it('should synthesise outgoing arc weight', () => {
        const net = parserService.parse(`.type pn
.transitions
a A
.places
1 0
.arcs
a 1`)!;
        expect(net).toBeTruthy();

        synthesiser.addRegion(mockRegion(net, {'1': 2}, {'A': {inflow: 0, outflow: 2}}));

        const result = synthesiser.synthesise();
        expect(result).toBeTruthy();

        const expected = parserService.parse(`.type pn
.transitions
a A
.places
1 0
.arcs
a 1 2`)!;
        expect(expected).toBeTruthy();

        expect(isomorphismService.arePetriNetsIsomorphic(result,expected)).toBeTrue();
    });

    it('should synthesise initial marking from weighted region', () => {
        const net = parserService.parse(`.type pn
.transitions
a A
.places
1 1
.arcs
1 a`)!;
        expect(net).toBeTruthy();

        synthesiser.addRegion(mockRegion(net, {'1': 2}, {'A': {inflow: 2, outflow: 0}}));

        const result = synthesiser.synthesise();
        expect(result).toBeTruthy();

        const expected = parserService.parse(`.type pn
.transitions
a A
.places
1 2
.arcs
1 a 2`)!;
        expect(expected).toBeTruthy();

        expect(isomorphismService.arePetriNetsIsomorphic(result,expected)).toBeTrue();
    });

    it('should synthesise initial marking from weighted initial marking', () => {
        const net = parserService.parse(`.type pn
.transitions
a A
.places
1 2
.arcs
1 a`)!;
        expect(net).toBeTruthy();

        synthesiser.addRegion(mockRegion(net, {'1': 1}, {'A': {inflow: 1, outflow: 0}}));

        const result = synthesiser.synthesise();
        expect(result).toBeTruthy();
        expect(isomorphismService.arePetriNetsIsomorphic(result,net)).toBeTrue();
    });

    it('should synthesise short-loops', () => {
        const net = parserService.parse(`.type pn
.transitions
a A
.places
1 0
.arcs
1 a 4
a 1 2`)!;
        expect(net).toBeTruthy();

        synthesiser.addRegion(mockRegion(net, {'1': 1}, {'A': {inflow: 4, outflow: 2}}));

        const result = synthesiser.synthesise();
        expect(result).toBeTruthy();
        expect(isomorphismService.arePetriNetsIsomorphic(result,net)).toBeTrue();
    });

    it('should not synthesise ingoing short-loops', () => {
        const net = parserService.parse(`.type pn
.transitions
a A
.places
1 0
.arcs
1 a 4
a 1 2`)!;
        expect(net).toBeTruthy();

        synthesiser.addRegion(mockRegion(net, {'1': 1}, {'A': {inflow: 4, outflow: 2}}));

        const result = synthesiser.synthesise({noShortLoops: true});
        expect(result).toBeTruthy();

        const expected = parserService.parse(`.type pn
.transitions
a A
.places
1 0
.arcs
1 a 2`)!;
        expect(expected).toBeTruthy();

        expect(isomorphismService.arePetriNetsIsomorphic(result,expected)).toBeTrue();
    });

    it('should not synthesise outgoing short-loops', () => {
        const net = parserService.parse(`.type pn
.transitions
a A
.places
1 0
.arcs
1 a 2
a 1 4`)!;
        expect(net).toBeTruthy();

        synthesiser.addRegion(mockRegion(net, {'1': 1}, {'A': {inflow: 2, outflow: 4}}));

        const result = synthesiser.synthesise({noShortLoops: true});
        expect(result).toBeTruthy();

        const expected = parserService.parse(`.type pn
.transitions
a A
.places
1 0
.arcs
a 1 2`)!;
        expect(expected).toBeTruthy();

        expect(isomorphismService.arePetriNetsIsomorphic(result,expected)).toBeTrue();
    });
});




function mockRegion(net: PetriNet, region: Multiset, rises: { [label: string]: Flow }): PetriNetRegion {
    return {
        netAndMarking: [{net: net!, marking: new Marking(region)}],
        rises: mockRises(rises),
        indexWithInitialStates: 0
    }
}

function mockRises(rises: { [label: string]: Flow }): Map<string, Flow> {
    const r = new Map<string, Flow>();
    for (const [label, flow] of Object.entries(rises)) {
        r.set(label, flow);
    }
    return r;
}
