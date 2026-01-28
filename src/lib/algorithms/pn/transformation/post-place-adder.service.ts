import {Injectable} from "@angular/core";
import {PetriNet} from "../../../models/pn/model/petri-net";
import {IncrementingCounter} from "../../../utility/incrementing-counter";
import {Place} from "../../../models/pn/model/place";


@Injectable({
    providedIn: 'root'
})
export class PostPlaceAdderService {

    /**
     * @param net a labeled Petri Net containing transitions with an empty post-set
     * @returns a copy of the input Petri net where every transition that originally had an empty post-set now has a new unique place in its post-set
     */
    public addPostPlaces(net: PetriNet): PetriNet {
        const clone = net.clone();

        for (let t of clone.getTransitions()) {
            if (t.outgoingArcs.length > 0) {
                continue;
            }

            const p = new Place();
            clone.addPlace(p);
            clone.addArc(t,p);
        }

        return clone;
    }

}
