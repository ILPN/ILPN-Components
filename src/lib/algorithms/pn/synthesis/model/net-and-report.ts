import {PetriNet} from '../../../../models/pn/model/petri-net';
import {AlgorithmResult} from '../../../../utility/algorithm-result';


export interface NetAndReport {
    net: PetriNet;
    report: AlgorithmResult;
}
