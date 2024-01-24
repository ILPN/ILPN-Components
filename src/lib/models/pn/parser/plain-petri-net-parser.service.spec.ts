import {PlainPetriNetParserService} from './plain-petri-net-parser.service';
import {TestBed} from '@angular/core/testing';
import {expect} from '@angular/flex-layout/_private-utils/testing';

describe('PetriNetParserService', () => {
    let originalLogFunction: (...data: any[]) => void;
    let service: PlainPetriNetParserService;
    let spy: jasmine.Spy;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        originalLogFunction = console.error;
        spy = jasmine.createSpy('error');
        console.error = spy;
        service = TestBed.inject(PlainPetriNetParserService);
    });

    afterEach(() => {
        console.error = originalLogFunction;
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('can parse empty net', () => {
        const result = service.parse(
            `.type pn
.transitions
.places
.arcs`
        )
        expect(result).toBeDefined();
        expect(result?.getTransitions().length).toBe(0);
        expect(result?.getPlaces().length).toBe(0);
        expect(result?.getArcs().length).toBe(0);
        expect(result?.inputPlaces.size).toBe(0);
        expect(result?.outputPlaces.size).toBe(0);
    });

    it('can parse net', () => {
        let result = service.parse(
            `.type pn
.transitions
a A
b
.places
c 1
.arcs
a c
c b 1
b c 2`
        );
        expect(result).toBeTruthy();
        expect(result?.getTransitions().length).toBe(2);
        expect(result?.getPlaces().length).toBe(1);
        expect(result?.getArcs().length).toBe(3);
        expect(result?.inputPlaces.size).toBe(0);
        expect(result?.outputPlaces.size).toBe(0);
        let a = result?.getTransition('a');
        expect(a).toBeTruthy();
        expect(a?.label).toBe('A');
        expect(a?.isSilent).toBeFalse();
        expect(a?.ingoingArcs.length).toBe(0);
        expect(a?.outgoingArcs.length).toBe(1);
        expect(a?.outgoingArcs[0].source).toBe(a);
        expect(a?.outgoingArcs[0].weight).toBe(1);
        let c = result?.getPlace('c');
        expect(c).toBeTruthy();
        expect(a?.outgoingArcs[0].destination).toBe(c);
        let b = result?.getTransition('b');
        expect(b).toBeTruthy();
        expect(b?.label).toBeUndefined();
        expect(b?.isSilent).toBeTrue();
        expect(b?.ingoingArcs.length).toBe(1);
        expect(b?.ingoingArcs[0].source).toBe(c);
        expect(b?.ingoingArcs[0].destination).toBe(b);
        expect(b?.ingoingArcs[0].weight).toBe(1);
        expect(b?.outgoingArcs.length).toBe(1);
        expect(b?.outgoingArcs[0].source).toBe(b);
        expect(b?.outgoingArcs[0].destination).toBe(c);
        expect(b?.outgoingArcs[0].weight).toBe(2);
        expect(c?.marking).toBe(1);
        expect(c?.ingoingArcs.length).toBe(2);
        expect(c?.outgoingArcs.length).toBe(1);

        result = service.parse(
            `.type pn
.transitions
a A
b A
.places
c 1
d 0
.arcs
c a
c b
a d
b d`
        );
        expect(result).toBeTruthy();
        expect(result?.getTransitions().length).toBe(2);
        expect(result?.getPlaces().length).toBe(2);
        expect(result?.getArcs().length).toBe(4);
        expect(result?.inputPlaces.size).toBe(1);
        expect(result?.outputPlaces.size).toBe(1);
        c = result?.getPlace('c');
        expect(c).toBeTruthy();
        expect(Array.from(result!.inputPlaces)[0]).toBe(c?.id);
        expect(c?.marking).toBe(1);
        expect(c?.ingoingArcs.length).toBe(0);
        expect(c?.outgoingArcs.length).toBe(2);
        const d = result?.getPlace('d');
        expect(d).toBeTruthy();
        expect(Array.from(result!.outputPlaces)[0]).toBe(d?.id);
        expect(d?.marking).toBe(0);
        expect(d?.ingoingArcs.length).toBe(2);
        expect(d?.outgoingArcs.length).toBe(0);
        a = result?.getTransition('a');
        expect(a).toBeTruthy();
        expect(a?.label).toBe('A');
        expect(a?.isSilent).toBeFalse();
        expect(a?.ingoingArcs.length).toBe(1);
        expect(a?.ingoingArcs[0].source).toBe(c);
        expect(a?.ingoingArcs[0].destination).toBe(a);
        expect(a?.ingoingArcs[0].weight).toBe(1);
        expect(a?.outgoingArcs.length).toBe(1);
        expect(a?.outgoingArcs[0].source).toBe(a);
        expect(a?.outgoingArcs[0].destination).toBe(d);
        expect(a?.outgoingArcs[0].weight).toBe(1);
        b = result?.getTransition('b');
        expect(b).toBeTruthy();
        expect(b?.label).toBe('A');
        expect(b?.isSilent).toBeFalse();
        expect(b?.ingoingArcs.length).toBe(1);
        expect(b?.ingoingArcs[0].source).toBe(c);
        expect(b?.ingoingArcs[0].destination).toBe(b);
        expect(b?.ingoingArcs[0].weight).toBe(1);
        expect(b?.outgoingArcs.length).toBe(1);
        expect(b?.outgoingArcs[0].source).toBe(b);
        expect(b?.outgoingArcs[0].destination).toBe(d);
        expect(b?.outgoingArcs[0].weight).toBe(1);
    });

    it('errors on incorrect place attributes', () => {
        expectErrorMessage(
            `.type pn
.transitions
.places
a
.arcs
`,
            'does not have the correct number of elements!'
        );
        expectErrorMessage(
            `.type pn
.transitions
.places
a a a
.arcs
`,
            'does not have the correct number of elements!'
        );
        expectErrorMessage(
            `.type pn
.transitions
.places
a a
.arcs
`,
            'marking cannot be parsed into a number!'
        );
        expectErrorMessage(
            `.type pn
.transitions
.places
a -1
.arcs
`,
            'marking is less than 0!'
        );
        expectErrorMessage(
            `.type pn
.transitions
.places
a 0
a 1
.arcs
`,
            'place ids must be unique!'
        );
    });

    it('errors on incorrect transition attributes', () => {
        expectErrorMessage(
            `.type pn
.transitions
a a a
.places
.arcs
`,
            'does not have the correct number of elements!'
        );
        expectErrorMessage(
            `.type pn
.transitions
a
a
.places
.arcs
`,
            'transition ids must be unique!'
        );
    });

    it('errors on incorrect arc attributes', () => {
        expectErrorMessage(
            `.type pn
.transitions
.places
.arcs
a
`,
            'does not have the correct number of elements!'
        );
        expectErrorMessage(
            `.type pn
.transitions
.places
.arcs
a a a a
`,
            'does not have the correct number of elements!'
        );
        expectErrorMessage(
            `.type pn
.transitions
.places
.arcs
a a a
`,
            'arc weight cannot be parsed into a number!'
        );
        expectErrorMessage(
            `.type pn
.transitions
.places
.arcs
a a 0
`,
            'arc weight is less than 1!'
        );
        expectErrorMessage(
            `.type pn
.transitions
.places
.arcs
a a
`,
            'arc source or destination is invalid!'
        );
        expectErrorMessage(
            `.type pn
.transitions
a
.places
.arcs
a a
`,
            'arc source or destination is invalid!'
        );
        expectErrorMessage(
            `.type pn
.transitions
a
.places
b 0
.arcs
a b
a b
`,
            'duplicate arcs between elements are not allowed!'
        );
    });

    function expectErrorMessage(net: string, messageContent: string): void {
        const parsed = service.parse(net);
        expect(parsed).toBeUndefined();
        console.dir(spy.calls.mostRecent().args);
        expect(spy.calls.mostRecent().args[0].includes(messageContent));
    }
});
