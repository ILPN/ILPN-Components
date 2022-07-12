import {Event} from './event';

export class Trace {

    public events: Array<Event> = [];
    public name?: string;
    public description?: string;

    constructor() {
    }

    public appendEvent(event: Event) {
        this.events.push(event);
    }
}
