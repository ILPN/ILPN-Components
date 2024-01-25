import {PetriNetParserService} from "../parser/petri-net-parser.service";
import {TestBed} from "@angular/core/testing";
import {PetriNet} from "./petri-net";
import {Marking} from "./marking";


describe('Petri net', () => {
    let parserService: PetriNetParserService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        parserService = TestBed.inject(PetriNetParserService);
        expect(parserService).toBeTruthy();
    });

    // TODO write tests for basic net functionality

    it('should fire enabled transition', () => {
        const net = parserService.parse(`.type pn
.transitions
a A
.places
i 1
o 0
x 2
.arcs
i a 1
x a 2
a o 1
a x 1`);
        expect(net).toBeTruthy();

        const newMarking = PetriNet.fireTransitionInMarking(net!, 'a', net!.getInitialMarking());
        expect(newMarking).toBeTruthy();
        expect(newMarking.equals(new Marking({'i': 0, 'o': 1, 'x': 1}))).toBeTrue();
    });

    it('label count should update on label change', () => {
        const net = parserService.parse(`.type pn
.transitions
a1 A
a2 A
b B
tau
x A
.places
.arcs`);
        expect(net).toBeDefined();

        let count = net!.getLabelCount();
        expect(count.size).toBe(3);
        expect(count.get('A')).toBe(3);
        expect(count.get('B')).toBe(1);
        expect(count.get(undefined)).toBe(1);

        const tx = net?.getTransition('x');
        expect(tx).toBeDefined();

        tx!.label = 'X';

        count = net!.getLabelCount();
        expect(count.size).toBe(4);
        expect(count.get('A')).toBe(2);
        expect(count.get('B')).toBe(1);
        expect(count.get(undefined)).toBe(1);
        expect(count.get('X')).toBe(1);
    });
});
