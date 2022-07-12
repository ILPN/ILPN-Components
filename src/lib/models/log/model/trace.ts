import {LogEvent} from './logEvent';

export class Trace {

    public events: Array<LogEvent> = [];
    public name?: string;
    public description?: string;

    constructor() {
    }

    public appendEvent(event: LogEvent) {
        this.events.push(event);
    }
}
