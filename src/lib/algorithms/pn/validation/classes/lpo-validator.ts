import {PetriNet} from '../../../../models/pn/model/petri-net';
import {PartialOrder} from '../../../../models/po/model/partial-order';
import {Event} from '../../../../models/po/model/event';
import {ValidationResult} from './validation-result';

export abstract class LpoValidator {

    protected readonly _petriNet: PetriNet;
    protected readonly _lpo: PartialOrder;

    protected constructor(petriNet: PetriNet, lpo: PartialOrder) {
        this._petriNet = petriNet;
        this._lpo = lpo.clone();
        this.modifyLPO();
    }

    protected modifyLPO() {
        for (const e of this._lpo.events) {
            for (const t of this._petriNet.getTransitions()) {
                if (e.label === t.label) {
                    if (e.transition !== undefined) {
                        throw new Error(`The algorithm does not support label-splitted nets`);
                    }
                    e.transition = t;
                }
            }
            if (e.transition === undefined) {
                throw new Error(`The net does not contain a transition with the label '${e.label}' of the event '${e.id}'`);
            }
        }

        const initial = new Event('initial marking', undefined);
        const final = new Event('final marking', undefined);
        for (const e of this._lpo.initialEvents) {
            initial.addNextEvent(e);
        }
        for (const e of this._lpo.finalEvents) {
            e.addNextEvent(final);
        }
        this._lpo.addEvent(initial);
        this._lpo.addEvent(final);
    }

    public abstract validate(): Array<ValidationResult>;

}
