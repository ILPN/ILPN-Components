import {PartialOrderParserService} from "./partial-order-parser.service";
import {TestBed} from "@angular/core/testing";
import {expect} from "@angular/flex-layout/_private-utils/testing";
import {PartialOrder} from "../model/partial-order";
import {arraysContainSameElements} from "../../../utility/test/arrays-contain-same-elements";


describe('PartialOrderParserService', () => {
    let originalLogFunction: (...data: any[]) => void;
    let service: PartialOrderParserService;
    let spy: jasmine.Spy;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        originalLogFunction = console.error;
        spy = jasmine.createSpy('error');
        console.error = spy;
        service = TestBed.inject(PartialOrderParserService);
    });

    afterEach(() => {
        console.error = originalLogFunction;
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('can parse empty PO', () => {
        const result = service.parse(
`.type po
.events
.arcs`
        );
        expect(result).toBeDefined();
        expect(result?.events.length).toBe(0);
    });

    it('can parse PO arc', () => {
        const result = service.parse(
            `.type po
.events
a A
b B
c C
.arcs
a b`
        );
        expect(result).toBeDefined();
        expect(result?.events.length).toBe(3);

        const a = getEvent(result!, 'a');
        expect(a).toBeTruthy();
        expect(a?.label).toBe('A');

        const b = getEvent(result!, 'b');
        expect(b).toBeTruthy();
        expect(b?.label).toBe('B');

        const c = getEvent(result!, 'c');
        expect(c).toBeTruthy();
        expect(c?.label).toBe('C');

        expect(a?.nextEvents.size).toBe(1);
        expect(Array.from(a?.nextEvents!)[0]).toBe(b);
        expect(a?.previousEvents.size).toBe(0);

        expect(b?.nextEvents.size).toBe(0);
        expect(b?.previousEvents.size).toBe(1);
        expect(Array.from(b?.previousEvents!)[0]).toBe(a);

        expect(c?.nextEvents.size).toBe(0);
        expect(c?.previousEvents.size).toBe(0);
    });

    it('can parse PO multiple arcs', () => {
        const result = service.parse(
            `.type po
.events
a A
b B
c C
.arcs
a b
a c`
        );
        expect(result).toBeDefined();
        expect(result?.events.length).toBe(3);

        const a = getEvent(result!, 'a');
        expect(a).toBeTruthy();
        expect(a?.label).toBe('A');

        const b = getEvent(result!, 'b');
        expect(b).toBeTruthy();
        expect(b?.label).toBe('B');

        const c = getEvent(result!, 'c');
        expect(c).toBeTruthy();
        expect(c?.label).toBe('C');

        expect(a?.nextEvents.size).toBe(2);
        expect(arraysContainSameElements(Array.from(a?.nextEvents!), [b, c])).toBeTrue();
        expect(a?.previousEvents.size).toBe(0);

        expect(b?.nextEvents.size).toBe(0);
        expect(b?.previousEvents.size).toBe(1);
        expect(Array.from(b?.previousEvents!)[0]).toBe(a);

        expect(c?.nextEvents.size).toBe(0);
        expect(c?.previousEvents.size).toBe(1);
        expect(Array.from(c?.previousEvents!)[0]).toBe(a);
    });

    it('errors on incorrect event attributes', () => {
        expectErrorMessage(
            `.type po
.events
a a a
.arcs
`,
            'does not have the correct number of elements!'
        );
        expectErrorMessage(
            `.type po
.events
a
.arcs
`,
            'does not have the correct number of elements!'
        );
        expectErrorMessage(
            `.type po
.events
a a
a b
.arcs
`,
            'event ids must be unique!'
        );
    });


    it('errors on incorrect arc attributes', () => {
        expectErrorMessage(
            `.type po
.events
a A
b B
.arcs
a b b
`,
            'does not have the correct number of elements!'
        );
        expectErrorMessage(
            `.type po
.events
a A
b B
.arcs
a
`,
            'does not have the correct number of elements!'
        );
        expectErrorMessage(
            `.type po
.events
a A
.arcs
a a
`,
            'specifies a reflexive arc!'
        );
        expectErrorMessage(
            `.type po
.events
a A
.arcs
a b
`,
            'specifies an arc between at least one event that does not exist in the partial order!'
        );
    });


    function expectErrorMessage(net: string, messageContent: string): void {
        const parsed = service.parse(net);
        expect(parsed).toBeUndefined();
        console.dir(spy.calls.mostRecent().args);
        expect(spy.calls.mostRecent().args[0].includes(messageContent));
    }

});

function getEvent(po: PartialOrder, id: string) {
    return po.events.find(e => e.id === id);
}
