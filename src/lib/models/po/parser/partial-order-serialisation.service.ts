import {Injectable} from '@angular/core';
import {PartialOrder} from '../model/partial-order';
import {AbstractParser} from '../../../utility/abstract-parser';
import {Event} from '../model/event';
import {BlockType} from './block-type';

@Injectable({
    providedIn: 'root'
})
export class PartialOrderSerialisationService {

    constructor() {
    }

    public serialise(po: PartialOrder): string {
        return `${AbstractParser.TYPE_BLOCK} po\n`
        + this.serialiseEvents(po.events)
        + this.serialiseArcs(po.events);
    }

    private serialiseEvents(events: Array<Event>): string {
        let result = `${BlockType.EVENTS}\n`;
        events.forEach(e => {
            result += `${e.id} ${this.removeSpaces(e.label ?? '', e.id)}\n`;
        });
        return result;
    }

    private serialiseArcs(events: Array<Event>): string {
        let result = `${BlockType.ARCS}\n`;
        for (const e of events) {
            for (const pre of e.previousEvents) {
                result += `${pre.id} ${e.id}\n`;
            }
        }
        return result;
    }

    private removeSpaces(str: string, id: string): string {
        if (str.includes(' ')) {
            console.warn(`Partial order event with id '${id}' contains a spaces in its label! Replacing spaces with underscores, no uniqueness check is performed!`)
            return str.replace(/ /g, '_');
        }
        else {
            return str;
        }
    }
}
