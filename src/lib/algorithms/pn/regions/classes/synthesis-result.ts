import {PetriNet} from '../../../../models/pn/model/petri-net';

export class SynthesisResult {
    constructor(public input: PetriNet, public result: PetriNet, public fileName: string) {
    }
}
