import {PetriNet} from '../../../../models/pn/model/petri-net';
import {Marking} from '../../../../models/pn/model/marking';
import {Flow} from "./flow";

export interface PetriNetRegion {
    /**
     * A list of specification nets and their markings that form a Petri net region
     */
    netAndMarking: Array<{ net: PetriNet, marking: Marking }>;
    /**
     * The inflow/outflow pair with the minimal inflow for each transition label
     */
    rises: Map<string, Flow>;
    /**
     * Index of the first Petri net, that contains information about the initial state
     */
    indexWithInitialStates?: number;
}
