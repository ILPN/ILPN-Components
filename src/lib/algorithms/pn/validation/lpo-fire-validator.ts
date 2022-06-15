import {LpoValidator} from './classes/lpo-validator';
import {PetriNet} from '../../../models/pn/model/petri-net';
import {PartialOrder} from '../../../models/po/model/partial-order';
import {Event} from '../../../models/po/model/event';
import {Place} from '../../../models/pn/model/place';
import {ValidationResult} from './classes/validation-result';

export class LpoFireValidator extends LpoValidator {

    constructor(petriNet: PetriNet, lpo: PartialOrder) {
        super(petriNet, lpo);
    }

    protected override modifyLPO() {
        super.modifyLPO();
        this._lpo.determineInitialAndFinalEvents();
    }

    validate(): Array<ValidationResult> {
        const totalOrder = this.buildTotalOrdering();
        const places = this._petriNet.getPlaces();
        totalOrder.forEach(e => e.initializeLocalMarking(places.length));

        // build start event
        const initialEvent = totalOrder[0];
        for (let i = 0; i < places.length; i++) {
            initialEvent.localMarking![i] = places[i].marking;
        }

        const validPlaces = new Array<boolean>(places.length).fill(true);
        const complexPlaces = new Array<boolean>(places.length).fill(false);
        const notValidPlaces = new Array<boolean>(places.length).fill(false);

        // TODO timing

        let queue = [...totalOrder];
        while (queue.length > 0) {
            const e = queue.shift() as Event;

            // can fire?
            if (e.transition !== undefined) {
                // fire
                for (const arc of e.transition.ingoingArcs) {
                    const pIndex = this.getPIndex(places, arc.source as Place);
                    e.localMarking![pIndex] = e.localMarking![pIndex] - arc.weight;
                    if (e.localMarking![pIndex] < 0) {
                        validPlaces[pIndex] = false;
                    }
                }

                for (const arc of e.transition.outgoingArcs) {
                    const pIndex = this.getPIndex(places, arc.destination as Place);
                    e.localMarking![pIndex] = e.localMarking![pIndex] + arc.weight;
                }
            }

            // push to first later and check for complex places
            if (e.nextEvents.size > 0) {
                for (let i = 0; i < places.length; i++) {
                    if (e.nextEvents.size > 1 && e.localMarking![i] > 0) {
                        complexPlaces[i] = true;
                    }
                    const firstLater = [...e.nextEvents][0];
                    firstLater.localMarking![i] = firstLater.localMarking![i] + e.localMarking![i];
                }
            }
        }

        // not valid places
        const finalEvent = [...this._lpo.finalEvents][0];
        for (let i = 0; i < places.length; i++) {
            notValidPlaces[i] = finalEvent.localMarking![i] < 0;
        }

        // Don't fire all backwards!
        queue = [];

        return [];
    }

    private buildTotalOrdering(): Array<Event> {
        const ordering: Array<Event> = [...this._lpo.initialEvents];
        const contained: Set<Event> = new Set<Event>(this._lpo.initialEvents);

        const examineLater: Array<Event> = [...this._lpo.events];
        while (examineLater.length > 0) {
            const e = examineLater.shift() as Event;
            if (contained.has(e)) {
                continue;
            }

            let add = true;
            for (const pre of e.previousEvents) {
                if (!contained.has(pre)) {
                    add = false;
                    break;
                }
            }
            if (add) {
                ordering.push(e);
                contained.add(e);
            } else {
                examineLater.push(e);
            }
        }

        return ordering;
    }

    private getPIndex(places: Array<Place>, p: Place) {
        return places.findIndex(pp => pp === p);
    }
}
