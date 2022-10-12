import {PartialOrderNetWithContainedTraces} from '../../../models/pn/model/partial-order-net-with-contained-traces';
import {PetriNet} from '../../../models/pn/model/petri-net';
import {Trace} from '../../../models/log/model/trace';

export class PrimeMinerInput extends PartialOrderNetWithContainedTraces {

    public lastIterationChangedModel?: boolean;

    constructor(net: PetriNet, containedTraces: Array<Trace>) {
        super(net, containedTraces);
    }

    public static fromPartialOrder(po: PartialOrderNetWithContainedTraces, changed: boolean = false): PrimeMinerInput {
        const r = new PrimeMinerInput(po.net, po.containedTraces);
        r.lastIterationChangedModel = changed;
        return r;
    }
}
