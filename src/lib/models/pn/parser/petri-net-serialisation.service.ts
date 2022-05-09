import {Injectable} from '@angular/core';
import {PetriNet} from '../model/petri-net';
import {Transition} from '../model/transition';
import {Place} from '../model/place';
import {Arc} from '../model/arc';
import {BlockType} from '../block-type';

@Injectable({
    providedIn: 'root'
})
export class PetriNetSerialisationService {

    constructor() {
    }

    public serialise(net: PetriNet): string {
        return `${BlockType.TYPE} pn\n`
        + this.serialiseFrequency(net.frequency)
        + this.serialiseTransitions(net.getTransitions())
        + this.serialisePlaces(net.getPlaces())
        + this.serialiseArcs(net.getArcs());
    }

    private serialiseFrequency(frequency: number | undefined): string {
        if (frequency === undefined) {
            return '';
        }
        return `${BlockType.FREQUENCY} ${frequency}`;
    }

    private serialiseTransitions(transitions: Array<Transition>): string {
        let result = `${BlockType.TRANSITIONS}\n`;
        transitions.forEach(t => {
            result += `${this.removeSpaces(t.id, t.id)} ${this.removeSpaces(t.label ?? '', t.id)}\n`;
        });
        return result;
    }

    private serialisePlaces(places: Array<Place>): string {
        let result = `${BlockType.PLACES}\n`;
        places.forEach(p => {
            result += `${this.removeSpaces(p.id, p.id)} ${p.marking}\n`;
        });
        return result;
    }

    private serialiseArcs(arcs: Array<Arc>): string {
        let result = `${BlockType.ARCS}\n`;
        arcs.forEach(a => {
            result += `${this.removeSpaces(a.sourceId, a.id)} ${this.removeSpaces(a.destinationId, a.id)}`;
            if (a.weight > 1) {
                result += ` ${a.weight}`;
            }
            result += '\n';
        });
        return result;
    }

    private removeSpaces(str: string, id: string): string {
        if (str.includes(' ')) {
            console.warn(`Petri net element with id '${id}' contains a spaces in its definition! Replacing spaces with underscores, no uniqueness check is performed!`)
            return str.replace(/ /g, '_');
        }
        else {
            return str;
        }
    }
}
