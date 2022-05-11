import {PetriNet} from '../../../../models/pn/model/petri-net';

export interface CombinationResult {
    net: PetriNet;
    inputs: Array<Set<string>>;
    outputs: Array<Set<string>>
}
