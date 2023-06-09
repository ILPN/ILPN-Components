import {Event} from "./event";


describe('Event', () => {

    it('should create', () => {
        const a = new Event('a');
        expect(a).toBeTruthy();
        expect(a.nextEvents).toBeTruthy();
        expect(a.nextEvents.size).toBe(0);
        expect(a.previousEvents).toBeTruthy();
        expect(a.previousEvents.size).toBe(0);
    });

    it('can add and remove next event', () => {
        const a = new Event('a');
        const b = new Event('b');
        a.addNextEvent(b);

        expect(a.nextEvents.size).toBe(1);
        expect(Array.from(a.nextEvents)[0]).toBe(b);
        expect(a.previousEvents.size).toBe(0);

        expect(b.nextEvents.size).toBe(0);
        expect(b.previousEvents.size).toBe(1);
        expect(Array.from(b.previousEvents)[0]).toBe(a);

        a.removeNextEvent(b);

        expect(a.nextEvents.size).toBe(0);
        expect(a.previousEvents.size).toBe(0);
        expect(b.nextEvents.size).toBe(0);
        expect(b.previousEvents.size).toBe(0);
    });
});
