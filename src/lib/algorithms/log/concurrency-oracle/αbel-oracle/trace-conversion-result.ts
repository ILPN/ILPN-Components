import {PetriNet} from '../../../../models/pn/model/petri-net';

export class TraceConversionResult {

    constructor(public nets: Array<PetriNet>, public labelMapping: Map<string, string>) {}

}
