import {Injectable} from '@angular/core';
import {PetriNet} from '../../../models/pn/model/petri-net';
import {Place} from '../../../models/pn/model/place';


@Injectable({
    providedIn: 'root'
})
export class DuplicatePlaceRemoverService {

    constructor() {
    }

    /**
     * @param net a labeled Petri Net containing duplicate places
     * @returns a copy of the input Petri net without the duplicate places
     */
    public removeDuplicatePlaces(net: PetriNet): PetriNet {
        return DuplicatePlaceRemoverService.removeDuplicatePlacesStatic(net);
    }

    /**
     * @param net a labeled Petri Net containing duplicate places
     * @returns a copy of the input Petri net without the duplicate places
     */
    public static removeDuplicatePlacesStatic(net: PetriNet): PetriNet {
        const clone = net.clone();

        const places = clone.getPlaces();

        for (let i = 0; i < places.length - 1; i++) {
            const p1 = places[i];
            for (let j = i + 1; j < places.length; j++) {
                const p2 = places[j];
                if (DuplicatePlaceRemoverService.arePlacesTheSame(p1, p2)) {
                    clone.removePlace(p1);
                    break;
                }
            }
        }

        return clone;
    }

    private static arePlacesTheSame(p1: Place, p2: Place): boolean {
        return DuplicatePlaceRemoverService.compareArcs(p1.ingoingArcWeights, p2.ingoingArcWeights) && DuplicatePlaceRemoverService.compareArcs(p1.outgoingArcWeights, p2.outgoingArcWeights);
    }

    private static compareArcs(a1: Map<string, number>, a2: Map<string, number>): boolean {
        if (a1.size !== a2.size) {
            return false;
        }
        for (const [tid, weight] of a1.entries()) {
            if (a2.get(tid) !== weight) {
                return false;
            }
        }
        return true;
    }

}
