import {Event} from '../../../../models/po/model/event';

export class IsomorphismCandidate {
    constructor(public target: Event, public candidates: Array<Event>) {
    }
}
