import {PetriNet} from '../../../models/pn/model/petri-net';

/**
 * A single net in the Prime miner result sequence.
 */
export class PrimeMinerResult {
    /**
     * The synthesised model
     */
    public net: PetriNet;
    /**
     * List of one based indices of the partial orders included in the model. The indices index the SORTED PO order.
     */
    public supportedPoIndices: Array<number>;

    constructor(net: PetriNet, supportedPoIndices: Array<number>) {
        this.net = net;
        this.supportedPoIndices = supportedPoIndices;
    }
}
