import {Trace} from '../../../../models/log/model/trace';
import {PartialOrder} from '../../../../models/po/model/partial-order';
import {Lifecycle} from '../../../../models/log/model/lifecycle';
import {MultisetEquivalentTraces} from './multiset-equivalent-traces';
import {Multiset, MultisetMap} from '../../../../utility/multiset-map';
import {PrefixTree} from '../../../../utility/prefix-tree';

export class AbelOracle {

    public determineConcurrency(log: Array<Trace>): Array<PartialOrder> {
        const multisetEquivalentTraces = new MultisetMap<MultisetEquivalentTraces>();
        const tracePrefixTree = new PrefixTree<MultisetEquivalentTraces>();

        for (const t of log) {
            const trace = this.cleanTrace(t);

            const multiset: Multiset = {};
            tracePrefixTree.insert(trace, () => {
                let equivalence = multisetEquivalentTraces.get(multiset);
                if (equivalence === undefined) {
                    equivalence = this.createEquivalence(trace, multiset);
                    multisetEquivalentTraces.put(equivalence);
                } else {
                    equivalence.addTrace(trace);
                }
                return equivalence;
            }, equivalence => {
                equivalence.incrementCount();
            }, event => {
                if (multiset[event] === undefined) {
                    multiset[event] = 1;
                } else {
                    multiset[event] += 1;
                }
            });
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

    private createEquivalence(trace: Trace, multiset: Multiset): MultisetEquivalentTraces {
        const equivalence = new MultisetEquivalentTraces(multiset);
        equivalence.addTrace(trace);
        return equivalence;
    }
}
