import {PetriNet} from '../../../../models/pn/model/petri-net';
import {Trace} from "../../../../models/log/model/trace";


export class IncrementalMinerInput {

    public constructor(public model: PetriNet,
                       public partialOrder: PetriNet,
                       public containedIndices: Array<number>,
                       public containedTraces: Array<Trace>,
                       public missingIndices: Array<number> = []) {
    }

    public hasNoMissingIndices(): boolean {
        return this.missingIndices.length === 0;
    }
}
