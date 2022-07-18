import {Injectable} from '@angular/core';
import {Trace} from '../../../../models/log/model/trace';
import {Lifecycle} from '../../../../models/log/model/lifecycle';
import {MultisetEquivalentTraces} from './multiset-equivalent-traces';
import {Multiset, MultisetMap} from '../../../../utility/multiset-map';
import {PrefixTree} from '../../../../utility/prefix-tree';
import {PetriNetRegionSynthesisService} from '../../../pn/regions/petri-net-region-synthesis.service';
import {PetriNet} from '../../../../models/pn/model/petri-net';
import {IncrementingCounter} from '../../../../utility/incrementing-counter';
import {Place} from '../../../../models/pn/model/place';
import {Transition} from '../../../../models/pn/model/transition';
import {Arc} from '../../../../models/pn/model/arc';
import {forkJoin, map, Observable} from 'rxjs';
import {TraceConversionResult} from './trace-conversion-result';
import {ConcurrencyOracle} from '../concurrency-oracle';
import {Relabeler} from '../../../../utility/relabeler';

@Injectable({
    providedIn: 'root'
})
export class AbelOracleService implements ConcurrencyOracle {

    constructor(private _regionSynthesisService: PetriNetRegionSynthesisService) {
    }

    public determineConcurrency(log: Array<Trace>): Observable<Array<PetriNet>> {
        const multisetEquivalentTraces = this.obtainMultisetEquivalentTraces(log);
        return forkJoin(multisetEquivalentTraces.map(traces => this.computePartialOrderFromEquivalentTraces(traces)));
    }

    private obtainMultisetEquivalentTraces(log: Array<Trace>): Array<MultisetEquivalentTraces> {
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

        return multisetEquivalentTraces.values();
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

    private computePartialOrderFromEquivalentTraces(traces: MultisetEquivalentTraces): Observable<PetriNet> {
        const conversionResult = this.convertTracesToPetriNets(traces.traces);

        return this._regionSynthesisService.synthesise(conversionResult.nets, {obtainPartialOrders: true, oneBoundRegions: true}).pipe(
            map(r => {
                const net = this.relabelNet(r.result, conversionResult.labelMapping);
                net.frequency = traces.count;
                return net;
            })
        );
    }

    private convertTracesToPetriNets(traces: Array<Trace>): TraceConversionResult {
        const relabeler = new Relabeler();

        const nets: Array<PetriNet> = traces.map(trace => {
            const netCounter = new IncrementingCounter();
            const net = new PetriNet();

            let lastPlace = new Place(`p${netCounter.next()}`, 0, 0, 0);
            net.addPlace(lastPlace);

            for (const event of trace.events) {
                const t = new Transition(`t${netCounter.next()}`, 0, 0, relabeler.getNewLabel(event.name));
                net.addTransition(t);
                net.addArc(new Arc(`a${netCounter.next()}`, lastPlace, t, 1));
                lastPlace = new Place(`p${netCounter.next()}`, 0, 0, 0);
                net.addPlace(lastPlace);
                net.addArc(new Arc(`a${netCounter.next()}`, t, lastPlace, 1));
            }

            relabeler.restartSequence();
            return net;
        });

        return new TraceConversionResult(nets, relabeler.getLabelMapping());
    }

    private relabelNet(net: PetriNet, labelMapping: Map<string, string>): PetriNet {
        net.getTransitions().forEach(t => {
            t.label = labelMapping.get(t.label!)!;
        });
        return net;
    }
}
