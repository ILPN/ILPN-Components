import {PetriNet} from '../../../../models/pn/model/petri-net';
import {OccurrenceMatrix} from '../occurrence-matrix';

export interface TraceConversionResult {
    nets: Array<PetriNet>;
    occurrenceMatrix: OccurrenceMatrix;
}
