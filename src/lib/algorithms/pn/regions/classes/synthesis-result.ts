import {PetriNet} from '../../../../models/pn/model/petri-net';

export class SynthesisResult {
    constructor(public input: Array<PetriNet>, public result: PetriNet, public fileName = "") {
    }
}
