import {Transition} from '../../pn/model/transition';
import {EditableString} from "../../../utility/string-sequence";

export class Event implements EditableString {
    private readonly _id: string;
    private _label: string | undefined;
    private readonly _nextEvents: Set<Event>;
    private readonly _previousEvents: Set<Event>;

    private _transition: undefined | Transition;
    private _localMarking: undefined | Array<number>;

    constructor(id: string, label?: string) {
        this._id = id;
        this._label = label;
        this._nextEvents = new Set<Event>();
        this._previousEvents = new Set<Event>();
    }

    get id(): string {
        return this._id;
    }

    get label(): string | undefined {
        return this._label;
    }

    set label(value: string | undefined) {
        this._label = value;
    }

    get nextEvents(): Set<Event> {
        return this._nextEvents;
    }

    get previousEvents(): Set<Event> {
        return this._previousEvents;
    }

    get transition(): Transition | undefined {
        return this._transition;
    }

    set transition(value: Transition | undefined) {
        this._transition = value;
    }

    get localMarking(): Array<number> | undefined {
        return this._localMarking;
    }

    public addNextEvent(event: Event) {
        this._nextEvents.add(event);
        event.addPreviousEvent(this);
    }

    protected addPreviousEvent(event: Event) {
        this._previousEvents.add(event);
    }

    public removeNextEvent(event: Event) {
        this._nextEvents.delete(event);
        event.removePreviousEvent(this);
    }

    protected removePreviousEvent(event: Event) {
        this._previousEvents.delete(event);
    }

    public initializeLocalMarking(size: number) {
        this._localMarking = new Array<number>(size).fill(0);
    }

    getString(): string {
        const l = this.label;
        if (l === undefined) {
            throw new Error('Event label is undefined');
        }
        return l;
    }

    setString(value: string): void {
        this.label = value;
    }
}
