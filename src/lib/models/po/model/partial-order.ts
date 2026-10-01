import {Event} from './event';
import {Trace} from "../../log/model/trace";

export class PartialOrder {
    public frequency?: number;

    private readonly _events: Map<string, Event>;
    private readonly _initialEvents: Set<Event>;
    private readonly _finalEvents: Set<Event>;
    private readonly _containedTraces: Array<Trace>;

    constructor() {
        this._events = new Map<string, Event>();
        this._initialEvents = new Set<Event>();
        this._finalEvents = new Set<Event>();
        this._containedTraces = [];
    }

    get initialEvents(): Set<Event> {
        return this._initialEvents;
    }

    get finalEvents(): Set<Event> {
        return this._finalEvents;
    }

    get events(): Array<Event> {
        return Array.from(this._events.values());
    }

    get containedTraces(): Array<Trace> {
        return [...this._containedTraces];
    }

    public getEvent(id: string): Event | undefined {
        return this._events.get(id);
    }

    public addEvent(event: Event): void {
        if (this._events.has(event.id)) {
            throw new Error(`An event with id '${event.id}' already exists in this partial order!`);
        }
        this._events.set(event.id, event);
    }

    public determineInitialAndFinalEvents() {
        this._initialEvents.clear();
        this._finalEvents.clear();
        for (const e of this._events.values()) {
            if (e.previousEvents.size === 0) {
                this._initialEvents.add(e);
            }
            if (e.nextEvents.size === 0) {
                this._finalEvents.add(e);
            }
        }
    }

    public clone(): PartialOrder {
        const result = new PartialOrder();
        for (const e of this._events.values()) {
            result.addEvent(new Event(e.id, e.label));
        }
        for (const e of this._events.values()) {
            const cloneE = result.getEvent(e.id) as Event;
            for (const nextE of e.nextEvents) {
                cloneE.addNextEvent(result.getEvent(nextE.id) as Event);
            }
        }
        result.determineInitialAndFinalEvents();
        return result;
    }

    /**
     * Adds input traces to the current `containedTraces`
     */
    public addContainedTrace(...trace: Array<Trace>): void {
        this._containedTraces.splice(this._containedTraces.length, 0, ...trace);
    }
}
