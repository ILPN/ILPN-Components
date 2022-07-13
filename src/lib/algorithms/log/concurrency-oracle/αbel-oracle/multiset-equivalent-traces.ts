import {Trace} from '../../../../models/log/model/trace';
import {Multiset, MultisetEquivalent} from '../../../../utility/multiset-map';

export class MultisetEquivalentTraces extends MultisetEquivalent {

    public traces: Array<Trace> = [];

    constructor(multiset: Multiset) {
        super(multiset);
    }

    public addTrace(trace: Trace) {
        this.traces.push(trace);
    }

    merge(ms: MultisetEquivalentTraces): void {
        this.traces.push(...ms.traces);
    }

}
