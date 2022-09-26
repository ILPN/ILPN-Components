import {Injectable} from '@angular/core';
import {PetriNet} from '../../../models/pn/model/petri-net';
import {Trace} from '../../../models/log/model/trace';

@Injectable({
    providedIn: 'root'
})
export class ImplicitPlaceRemoverService {

    constructor() {
    }

    /**
     * @param net a labeled Petri Net containing implicit places with no label-splitting and no silent transitions
     * @param log a firing sequences of the labels contained in the net, for which the places are implicit
     * @returns a copy of the input Petri net without the implicit places
     */
    public removeImplicitPlaces(net: PetriNet, log: Array<Trace>): PetriNet {
        return new PetriNet();
    }
}
