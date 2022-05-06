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
            result += `${t.id} ${t.label ?? ''}\n`;
        });
        return result;
    }

    private serialisePlaces(places: Array<Place>): string {
        let result = `${BlockType.PLACES}\n`;
        places.forEach(p => {
            result += `${p.id} ${p.marking}\n`;
        });
        return result;
    }

    private serialiseArcs(arcs: Array<Arc>): string {
        let result = `${BlockType.ARCS}\n`;
        arcs.forEach(a => {
            result += `${a.sourceId} ${a.destinationId}`;
            if (a.weight > 1) {
                result += ` ${a.weight}`;
            }
            result += '\n';
        });
        return result;
    }
}
