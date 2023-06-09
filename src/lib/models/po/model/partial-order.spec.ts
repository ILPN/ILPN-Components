import {PartialOrder} from "./partial-order";
import {Event} from "./event";
import {arraysContainSameElements} from "../../../utility/test/arrays-contain-same-elements";


describe('PartialOrder', () => {

    it('can add event', () => {
        const po = new PartialOrder();
        expect(po).toBeTruthy();
        expect(po.events.length).toBe(0);

        const e = new Event('a', 'A');
        po.addEvent(e);
        expect(po.events.length).toBe(1);
        expect(po.events[0]).toBe(e);
    });

    it('can identify empty initial and final event', () => {
        const po = new PartialOrder();
        po.determineInitialAndFinalEvents();
        expect(po.initialEvents).toBeDefined();
        expect(po.initialEvents.size).toBe(0);
        expect(po.finalEvents).toBeDefined();
        expect(po.finalEvents.size).toBe(0);
    });

    it('can identify initial and final event in a sequence', () => {
        const po = new PartialOrder();
        const a = new Event('a');
        const b = new Event('b');
        const c = new Event('c');
        po.addEvent(a);
        po.addEvent(b);
        po.addEvent(c);
        a.addNextEvent(b);
        b.addNextEvent(c);

        po.determineInitialAndFinalEvents();

        expect(po.initialEvents).toBeDefined();
        expect(po.initialEvents.size).toBe(1);
        expect(Array.from(po.initialEvents)[0]).toBe(a);

        expect(po.finalEvents).toBeDefined();
        expect(po.finalEvents.size).toBe(1);
        expect(Array.from(po.finalEvents)[0]).toBe(c);
    });

    it('can identify parallel initial and final events', () => {
        const po = new PartialOrder();
        const a = new Event('a');
        const b = new Event('b');
        po.addEvent(a);
        po.addEvent(b);

        po.determineInitialAndFinalEvents();

        expect(po.initialEvents).toBeDefined();
        expect(po.initialEvents.size).toBe(2);
        const initial = Array.from(po.initialEvents);
        expect(arraysContainSameElements(initial, [a, b])).toBeTrue();

        expect(po.finalEvents).toBeDefined();
        expect(po.finalEvents.size).toBe(2);
        const final = Array.from(po.finalEvents);
        expect(arraysContainSameElements(final, [a, b])).toBeTrue();
    });

    it('can identify parallel initial and final events in AND-join', () => {
        const po = new PartialOrder();
        const a = new Event('a');
        const b = new Event('b');
        const c = new Event('c');
        po.addEvent(a);
        po.addEvent(b);
        po.addEvent(c);
        a.addNextEvent(c);
        b.addNextEvent(c);

        po.determineInitialAndFinalEvents();

        expect(po.initialEvents).toBeDefined();
        expect(po.initialEvents.size).toBe(2);
        const initial = Array.from(po.initialEvents);
        expect(arraysContainSameElements(initial, [a, b])).toBeTrue();

        expect(po.finalEvents).toBeDefined();
        expect(po.finalEvents.size).toBe(1);
        expect(Array.from(po.finalEvents)[0]).toBe(c);
    });

    it('can identify parallel initial and final events in AND-split', () => {
        const po = new PartialOrder();
        const a = new Event('a');
        const b = new Event('b');
        const c = new Event('c');
        po.addEvent(a);
        po.addEvent(b);
        po.addEvent(c);
        a.addNextEvent(b);
        a.addNextEvent(c);

        po.determineInitialAndFinalEvents();

        expect(po.initialEvents).toBeDefined();
        expect(po.initialEvents.size).toBe(1);
        expect(Array.from(po.initialEvents)[0]).toBe(a);

        expect(po.finalEvents).toBeDefined();
        expect(po.finalEvents.size).toBe(2);
        const final = Array.from(po.finalEvents);
        expect(arraysContainSameElements(final, [b, c])).toBeTrue();
    });

});

