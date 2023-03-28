import {PetriNet} from '../../../../models/pn/model/petri-net';
import {Marking} from '../../../../models/pn/model/marking';

export interface PetriNetRegion {
    /**
     * A list of specification nets and their markings that form a Petri net region
     */
    netAndMarking: Array<{ net: PetriNet, marking: Marking }>;
    /**
     * An assignment of rises to transition labels
     */
    rises: Map<string, number>;
    /**
     * Index of the first Petri net, that contains information about the initial state
     */
    indexWithInitialStates?: number;
}
