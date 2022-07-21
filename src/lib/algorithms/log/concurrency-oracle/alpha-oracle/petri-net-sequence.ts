import {PetriNet} from '../../../../models/pn/model/petri-net';
import {Place} from '../../../../models/pn/model/place';
import {Transition} from '../../../../models/pn/model/transition';

export class PetriNetSequence {

    private _net: PetriNet;
    private _lastPlace: Place;

    constructor() {
        this._net = new PetriNet();
        this._lastPlace = new Place();
        this._net.addPlace(this._lastPlace);
    }

    get net(): PetriNet {
        return this._net;
    }

    public clone(): PetriNetSequence {
        const clone = new PetriNetSequence();
        clone._net = this._net.clone();
        clone._lastPlace = clone._net.getPlace(this._lastPlace.getId())!;
        return clone;
    }

    public appendTransition(label: string) {
        const t = new Transition(label);
        this._net.addTransition(t);
        this._net.addArc(this._lastPlace, t);
        this._lastPlace = new Place();
        this._net.addPlace(this._lastPlace);
        this._net.addArc(t, this._lastPlace);
    }
}
