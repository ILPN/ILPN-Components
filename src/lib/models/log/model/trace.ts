import {LogEvent} from './logEvent';
import {EditableStringSequence} from '../../../utility/string-sequence';

export class Trace implements EditableStringSequence {

    public events: Array<LogEvent> = [];
    public name?: string;
    public description?: string;

    constructor() {
    }

    get eventNames(): Array<string> {
        return this.events.map(e => e.name);
    }

    public appendEvent(event: LogEvent) {
        this.events.push(event);
    }

    get(i: number): string {
        return this.events[i].name;
    }

    set(i: number, value: string): void {
        this.events[i].name = value;
    }

    length(): number {
        return this.events.length;
    }

    clone(): Trace {
        const clone = new Trace();
        clone.name = this.name;
        clone.description = this.description;
        clone.events = [...this.events];
        return clone;
    }
}
