import {PetriNet} from '../../../../models/pn/model/petri-net';
import {Place} from '../../../../models/pn/model/place';
import {IncrementingCounter} from '../../../../utility/incrementing-counter';
import {Transition} from '../../../../models/pn/model/transition';
import {Arc} from '../../../../models/pn/model/arc';

export class PetriNetSequence {

    private _net: PetriNet;
    private _lastPlace: Place;

    constructor() {
        this._net = new PetriNet();
        this._lastPlace = new Place('p', 0, 0, 0);
        this._net.addPlace(this._lastPlace);
    }

    get net(): PetriNet {
        return this._net;
    }

    public clone(): PetriNetSequence {
        const clone = new PetriNetSequence();
        clone._net = this._net.clone();
        clone._lastPlace = clone._net.getPlace(this._lastPlace.id)!;
        return clone;
    }

    public appendTransition(label: string, counter: IncrementingCounter) {
        const t = new Transition(`t${counter.next()}`, 0, 0, label);
        this._net.addTransition(t);
        this._net.addArc(new Arc(`a${counter.next()}`, this._lastPlace, t, 1));
        this._lastPlace = new Place(`p${counter.next()}`, 0, 0, 0);
        this._net.addPlace(this._lastPlace);
        this._net.addArc(new Arc(`a${counter.next()}`, t, this._lastPlace, 1));
    }
}
