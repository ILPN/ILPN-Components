import {LpoValidator} from './classes/lpo-validator';
import {PetriNet} from '../../../models/pn/model/petri-net';
import {PartialOrder} from '../../../models/po/model/partial-order';
import {Event} from '../../../models/po/model/event';
import {Place} from '../../../models/pn/model/place';
import {ValidationResult} from './classes/validation-result';
import {Arc} from '../../../models/pn/model/arc';
import {Transition} from '../../../models/pn/model/transition';

export class LpoFireValidator extends LpoValidator {

    private readonly _places: Array<Place>;

    constructor(petriNet: PetriNet, lpo: PartialOrder) {
        super(petriNet, lpo);
        this._places = this._petriNet.getPlaces();
    }

    protected override modifyLPO() {
        super.modifyLPO();
        this._lpo.determineInitialAndFinalEvents();
    }

    validate(): Array<ValidationResult> {
        const totalOrder = this.buildTotalOrdering();
        totalOrder.forEach(e => e.initializeLocalMarking(this._places.length));

        // build start event
        const initialEvent = totalOrder[0];
        for (let i = 0; i < this._places.length; i++) {
            initialEvent.localMarking![i] = this._places[i].marking;
        }

        const validPlaces = this.newBoolArray(true);
        const complexPlaces = this.newBoolArray(false);
        const notValidPlaces = this.newBoolArray(false);

        // TODO timing

        let queue = [...totalOrder];
        this.fireForwards(queue, validPlaces, complexPlaces);

        // not valid places
        const finalEvent = [...this._lpo.finalEvents][0];
        for (let i = 0; i < this._places.length; i++) {
            notValidPlaces[i] = finalEvent.localMarking![i] < 0;
        }

        // Don't fire all backwards!
        queue = [finalEvent];
        for (let i = totalOrder.length - 2; i >= 0; i--) {
            totalOrder[i].initializeLocalMarking(this._places.length);
            queue.push(totalOrder[i]);
        }

        const backwardsValidPlaces = this.newBoolArray(true);
        const backwardsComplexPlaces = this.newBoolArray(false);

        // TODO timing 2

        // Is the final marking > 0 ?
        for (let i = 0; i < this._places.length; i++) {
            if (finalEvent.localMarking![i] < 0) {
                backwardsValidPlaces[i] = false;
            }
        }

        this.fireBackwards(queue, backwardsValidPlaces, backwardsComplexPlaces);

        // Rest with flow


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

    private fireForwards(queue: Array<Event>, validPlaces: Array<boolean>, complexPlaces: Array<boolean>) {
        this.fire(queue, validPlaces, complexPlaces,
            (t) => t.ingoingArcs,
            (a) => a.source as Place,
            (t) => t.outgoingArcs,
            (a) => a.destination as Place,
            (e) => e.nextEvents
        );
    }

    private fireBackwards(queue: Array<Event>, validPlaces: Array<boolean>, complexPlaces: Array<boolean>) {
        this.fire(queue, validPlaces, complexPlaces,
            (t) => t.outgoingArcs,
            (a) => a.destination as Place,
            (t) => t.ingoingArcs,
            (a) => a.source as Place,
            (e) => e.previousEvents
        );
    }

    private fire(firingOrder: Array<Event>, validPlaces: Array<boolean>, complexPlaces: Array<boolean>,
                 preArcs: (t: Transition) => Array<Arc>, prePlace: (a: Arc) => Place,
                 postArcs: (t: Transition) => Array<Arc>, postPlace: (a: Arc) => Place,
                 nextEvents: (e: Event) => Set<Event>) {
        while (firingOrder.length > 0) {
            const e = firingOrder.shift() as Event;

            // can fire?
            if (e.transition !== undefined) {
                // fire
                for (const arc of preArcs(e.transition)) {
                    const pIndex = this.getPIndex(prePlace(arc));
                    e.localMarking![pIndex] = e.localMarking![pIndex] - arc.weight;
                    if (e.localMarking![pIndex] < 0) {
                        validPlaces[pIndex] = false;
                    }
                }

                for (const arc of postArcs(e.transition)) {
                    const pIndex = this.getPIndex(postPlace(arc));
                    e.localMarking![pIndex] = e.localMarking![pIndex] + arc.weight;
                }
            }

            // push to first later and check for complex places
            if (nextEvents(e).size > 0) {
                for (let i = 0; i < this._places.length; i++) {
                    if (nextEvents(e).size > 1 && e.localMarking![i] > 0) {
                        complexPlaces[i] = true;
                    }
                    const firstLater = [...nextEvents(e)][0];
                    firstLater.localMarking![i] = firstLater.localMarking![i] + e.localMarking![i];
                }
            }
        }
    }

    private getPIndex(p: Place) {
        return this._places.findIndex(pp => pp === p);
    }

    private newBoolArray(fill: boolean): Array<boolean> {
        return new Array<boolean>(this._places.length).fill(fill);
    }
}
