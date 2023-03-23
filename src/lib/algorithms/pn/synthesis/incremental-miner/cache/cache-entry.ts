import {PetriNet} from '../../../../../models/pn/model/petri-net';

export interface CacheEntry {
    key: Set<number>;
    value: PetriNet;
}
