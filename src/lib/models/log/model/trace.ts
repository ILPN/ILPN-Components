import {Event} from './event';

export class Trace {

    public events: Array<Event> = [];

    constructor(public name?: string, public description?: string) {
    }

    public appendEvent(event: Event) {
        this.events.push(event);
    }
}
