import {PetriNet} from '../../../../models/pn/model/petri-net';
import {Place} from '../../../../models/pn/model/place';
import {Transition} from '../../../../models/pn/model/transition';
import {Trace} from '../../../../models/log/model/trace';
import {LogEvent} from '../../../../models/log/model/logEvent';

export class PetriNetSequence {

    private _net: PetriNet;
    private _lastPlace: Place;
    private _log: Trace;

    constructor() {
        this._net = new PetriNet();
        this._lastPlace = new Place();
        this._net.addPlace(this._lastPlace);
        this._log = new Trace();
    }

    get net(): PetriNet {
        return this._net;
    }

    get log(): Trace {
        return this._log;
    }

    public clone(): PetriNetSequence {
        const clone = new PetriNetSequence();
        clone._net = this._net.clone();
        clone._lastPlace = clone._net.getPlace(this._lastPlace.getId())!;
        clone._log = this._log.clone();
        return clone;
    }

    public appendEvent(label: string) {
        this._log.events.push(new LogEvent(label));
        this.appendTransition(label);
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
