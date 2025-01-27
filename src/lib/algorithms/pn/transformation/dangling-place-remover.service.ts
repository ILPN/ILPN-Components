import {Injectable} from "@angular/core";
import {PetriNet} from "../../../models/pn/model/petri-net";


@Injectable({
    providedIn: 'root'
})
export class DanglingPlaceRemoverService {

    /**
     * @param net a labeled Petri Net containing dangling places (a place with an empty post-set, whose transition in the pre-set have other places in their post-set)
     * @returns a copy of the input Petri net without the dangling places
     */
    public removeDanglingPlaces(net: PetriNet): PetriNet {
        const clone = net.clone();

        const places = clone.getPlaces();

        for (let i = 0; i < places.length; i++) {
            const p = places[i];
            if (p.outgoingArcs.length === 0 && p.ingoingArcs.every(a => a.source.outgoingArcs.length > 1)) {
                 clone.removePlace(p);
            }
        }

        return clone;
    }

}
