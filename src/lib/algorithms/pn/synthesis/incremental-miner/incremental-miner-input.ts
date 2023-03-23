import {PetriNet} from '../../../../models/pn/model/petri-net';


export class IncrementalMinerInput {

    public constructor(public netA: PetriNet,
                       public netB: PetriNet,
                       public missingIndices: Set<number> = new Set<number>()) {
    }

    public hasNoMissingIndices(): boolean {
        return this.missingIndices.size === 0;
    }
}
