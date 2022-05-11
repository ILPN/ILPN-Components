import {Injectable} from '@angular/core';
import {Result} from 'glpk.js';
import {PetriNet} from '../../../models/pn/model/petri-net';

@Injectable({
    providedIn: 'root'
})
export class PetriNetRegionTransformerService {

    constructor() {
    }

    public displayRegionInNet(solution: Result, net: PetriNet): PetriNet {
        const result = net.clone();

        Object.entries(solution.result.vars).forEach(([id, marking]) => {
            const place = result.getPlace(id);
            if (place === undefined) {
                return; // continue
            }
            place.marking = marking;
        })

        return result;
    }
}
