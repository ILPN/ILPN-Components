import {PetriNet} from './petri-net';
import {Trace} from '../../log/model/trace';

export class PartialOrderNetWithContainedTraces {
    constructor(public net: PetriNet, public containedTraces: Array<Trace>) {
    }
}
