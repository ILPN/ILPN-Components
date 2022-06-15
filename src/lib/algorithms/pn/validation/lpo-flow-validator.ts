import {PetriNet} from '../../../models/pn/model/petri-net';
import {PartialOrder} from '../../../models/po/model/partial-order';
import {MaxFlowPreflowN3} from '../../flow-network/max-flow-preflow-n3';
import {Transition} from '../../../models/pn/model/transition';
import {Place} from '../../../models/pn/model/place';
import {LpoValidator} from './classes/lpo-validator';
import {ValidationPhase, ValidationResult} from './classes/validation-result';
import {Event} from '../../../models/po/model/event';

export class LpoFlowValidator extends LpoValidator {

    constructor(petriNet: PetriNet, lpo: PartialOrder) {
        super(petriNet, lpo);
    }

    validate(): Array<ValidationResult> {
        const flow: Array<ValidationResult> = [];

        const places = this._petriNet.getPlaces();
        const events = this._lpo.events;

        for (let i = 0; i < places.length; i++) {
            const place = places[i];
            flow[i] = new ValidationResult(this.checkFlowForPlace(place, events), ValidationPhase.FLOW);
        }

        return flow;
    }

    protected checkFlowForPlace(place: Place, events: Array<Event>): boolean {
        const n = events.length * 2 + 2;
        const SOURCE = 0;
        const SINK = n - 1;

        const network = new MaxFlowPreflowN3(n);

        for (let eIndex = 0; eIndex < events.length; eIndex++) {
            network.setUnbounded(this.eventStart(eIndex), this.eventEnd(eIndex));

            const event = events[eIndex];
            if (event.transition === undefined) {
                if (place.marking > 0) {
                    network.setCap(SOURCE, this.eventEnd(eIndex), place.marking);
                }
            } else {
                for (const outArc of (event.transition as unknown as Transition).outgoingArcs) {
                    const postPlace = outArc.destination as Place;
                    if (postPlace === place) {
                        network.setCap(SOURCE, this.eventEnd(eIndex), outArc.weight);
                    }
                }
                for (const inArc of (event.transition as unknown as Transition).ingoingArcs) {
                    const prePlace = inArc.source as Place;
                    if (prePlace === place) {
                        network.setCap(this.eventStart(eIndex), SINK, inArc.weight);
                    }
                }
            }
            for (const postEvent of event.nextEvents) {
                network.setUnbounded(this.eventEnd(eIndex), this.eventStart(events.findIndex(e => e === postEvent)));
            }
        }

        let need = 0;
        for (let ii = 0; ii < n; ii++) {
            need += network.getCap(ii, SINK);
        }
        const f = network.maxFlow(SOURCE, SINK);
        console.debug(`flow ${place.id} ${f}`);
        console.debug(`need ${place.id} ${need}`);
        return need === f;
    }

    private eventStart(eventIndex: number): number {
        return eventIndex * 2 + 1;
    }

    private eventEnd(eventIndex: number): number {
        return eventIndex * 2 + 2;
    }

}
