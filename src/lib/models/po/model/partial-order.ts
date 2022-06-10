import {Event} from './event';

export class PartialOrder {
    private readonly _events: Map<string, Event>;
    private readonly _initialEvents: Set<Event>;

    constructor() {
        this._events = new Map<string, Event>();
        this._initialEvents = new Set<Event>();
    }

    get initialEvents(): Set<Event> {
        return this._initialEvents;
    }

    get events(): IterableIterator<Event> {
        return this._events.values();
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

    public determineInitialEvents() {
        for (const e of this._events.values()) {
            if (e.previousEvents.size === 0) {
                this._initialEvents.add(e);
            }
        }
    }
}
