import {PetriNet} from '../../../../models/pn/model/petri-net';


export class IncrementalMinerInput {

    public constructor(public model: PetriNet,
                       public partialOrder: PetriNet,
                       public missingIndices: Array<number> = []) {
    }

    public hasNoMissingIndices(): boolean {
        return this.missingIndices.length === 0;
    }
}