import {PetriNet} from '../../../../../models/pn/model/petri-net';

export interface CacheEntry {
    key: Array<number>;
    value: PetriNet;
}
