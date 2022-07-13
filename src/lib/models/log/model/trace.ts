import {LogEvent} from './logEvent';
import {StringSequence} from '../../../utility/prefix-tree';

export class Trace implements StringSequence {

    public events: Array<LogEvent> = [];
    public name?: string;
    public description?: string;

    constructor() {
    }

    public appendEvent(event: LogEvent) {
        this.events.push(event);
    }

    get(i: number): string {
        return this.events[i].name;
    }

    length(): number {
        return this.events.length;
    }
}
