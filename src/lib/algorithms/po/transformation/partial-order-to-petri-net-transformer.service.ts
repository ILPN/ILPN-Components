import {Injectable} from '@angular/core';
import {PartialOrder} from "../../../models/po/model/partial-order";
import {PetriNet} from "../../../models/pn/model/petri-net";
import {Transition} from "../../../models/pn/model/transition";
import {Event} from "../../../models/po/model/event";
import {Place} from "../../../models/pn/model/place";

@Injectable({
    providedIn: 'root'
})
export class PartialOrderToPetriNetTransformerService {

    constructor() {
    }

    public transform(po: PartialOrder): PetriNet {
        const result = new PetriNet();

        for (const e of po.events) {
            const myTransition = this.getOrCreateTransition(result, e);
            for (const next of e.nextEvents) {
                const nextTransition = this.getOrCreateTransition(result, next);
                const p = new Place();
                result.addPlace(p);
                result.addArc(myTransition, p);
                result.addArc(p, nextTransition);
            }
        }

        po.determineInitialAndFinalEvents();
        for (const initial of po.initialEvents) {
            const myTransition = this.getOrCreateTransition(result, initial);
            const p = new Place(1);
            result.addPlace(p);
            result.addArc(p, myTransition);
        }
        for (const final of po.finalEvents) {
            const myTransition = this.getOrCreateTransition(result, final);
            const p = new Place();
            result.addPlace(p);
            result.addArc(myTransition, p);
        }

        result.frequency = po.frequency;
        result.containedTraces.push(...po.containedTraces);
        return result;
    }

    private getOrCreateTransition(pn: PetriNet, e: Event): Transition {
        let t = pn.getTransition(e.id);
        if (t === undefined) {
            t = new Transition(e.label, e.id);
            pn.addTransition(t);
        }
        return t;
    }

}
