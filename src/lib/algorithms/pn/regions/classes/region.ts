import {PetriNet} from '../../../../models/pn/model/petri-net';

export interface Region {
    net: PetriNet;
    inputs: Array<string>;
}
