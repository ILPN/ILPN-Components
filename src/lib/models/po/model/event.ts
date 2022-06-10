export class Event {
    private readonly _id: string;
    private readonly _label: string;
    private readonly _nextEvents: Set<Event>;
    private readonly _previousEvents: Set<Event>;

    constructor(id: string, label: string) {
        this._id = id;
        this._label = label;
        this._nextEvents = new Set<Event>();
        this._previousEvents = new Set<Event>();
    }

    get id(): string {
        return this._id;
    }

    get label(): string {
        return this._label;
    }

    get nextEvents(): Set<Event> {
        return this._nextEvents;
    }

    get previousEvents(): Set<Event> {
        return this._previousEvents;
    }

    public addNextEvent(event: Event) {
        this._nextEvents.add(event);
    }

    public addPreviousEvent(event: Event) {
        this._previousEvents.add(event);
    }
}
