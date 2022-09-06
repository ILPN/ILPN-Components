import {PetriNetParserService} from './petri-net-parser.service';
import {TestBed} from '@angular/core/testing';
import {expect} from '@angular/flex-layout/_private-utils/testing';

describe('PetriNetParserService', () => {
    let originalLogFunction: (...data: any[]) => void;
    let service: PetriNetParserService;
    let spy: jasmine.Spy;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        originalLogFunction = console.error;
        spy = jasmine.createSpy('error');
        console.error = spy;
        service = TestBed.inject(PetriNetParserService);
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
        expect(result).toBeTruthy();
        expect(result?.getTransitions().length).toBe(0);
        expect(result?.getPlaces().length).toBe(0);
        expect(result?.getArcs().length).toBe(0);
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
