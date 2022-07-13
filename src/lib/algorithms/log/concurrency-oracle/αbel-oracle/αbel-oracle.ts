import {Trace} from '../../../../models/log/model/trace';
import {PartialOrder} from '../../../../models/po/model/partial-order';
import {Lifecycle} from '../../../../models/log/model/lifecycle';
import {MultisetEquivalentTraces} from './multiset-equivalent-traces';
import {Multiset, MultisetMap} from '../../../../utility/multiset-map';

export class AbelOracle {

    public determineConcurrency(log: Array<Trace>): Array<PartialOrder> {
        const multisetEquivalentTraces = new MultisetMap<MultisetEquivalentTraces>()

        for (const t of log) {
            const trace = this.cleanTrace(t);
            const equivalence = this.convertToEquivalence(trace);
            multisetEquivalentTraces.put(equivalence.multiset, equivalence);
        }

        return [];
    }

    private cleanTrace(trace: Trace): Trace {
        const result = new Trace();
        result.name = trace.name;
        result.description = trace.description;
        result.events = trace.events.filter(e => e.lifecycle === undefined || e.lifecycle === Lifecycle.COMPLETE);
        return result;
    }

    private convertToEquivalence(trace: Trace): MultisetEquivalentTraces {
        const equivalence = new MultisetEquivalentTraces(this.createTraceMultiset(trace));
        equivalence.addTrace(trace);
        return equivalence;
    }

    private createTraceMultiset(trace: Trace): Multiset {
        const result: Multiset = {};

        for (const e of trace.events) {
            if (result[e.name] === undefined) {
                result[e.name] = 1;
            } else {
                result[e.name] += 1;
            }
        }

        return result;
    }
}
