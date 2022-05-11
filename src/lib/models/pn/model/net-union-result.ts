import {PetriNet} from './petri-net';

export interface NetUnionResult {
    net: PetriNet;
    inputPlacesB: Set<string>;
    outputPlacesB: Set<string>;
}
