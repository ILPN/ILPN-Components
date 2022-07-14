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

@Injectable({
    providedIn: 'root'
})
export class AbelOracleService {

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

        return this._regionSynthesisService.synthesise(conversionResult.nets, {obtainPartialOrders: true}).pipe(
            map(r => {
                const net = this.relabelNet(r.result, conversionResult.labelMapping);
                net.frequency = traces.count;
                return net;
            })
        );
    }

    private convertTracesToPetriNets(traces: Array<Trace>): TraceConversionResult {
        const existingLabels = new Set<string>();
        const labelCounter = new IncrementingCounter();
        const labelMapping = new Map<string, string>();
        const labelOrder = new Map<string, Array<string>>();

        const nets: Array<PetriNet> = traces.map(trace => {
            const netCounter = new IncrementingCounter();
            const net = new PetriNet();
            const labelOrderIndex = new Map<string, number>();

            let lastPlace = new Place(`p${netCounter.next()}`, 0, 0, 0);
            net.addPlace(lastPlace);

            for (const event of trace.events) {

                let label: string;
                if (!existingLabels.has(event.name)) {
                    // label encountered for the first time
                    existingLabels.add(event.name);
                    labelMapping.set(event.name, event.name);
                    labelOrder.set(event.name, [event.name]);
                    labelOrderIndex.set(event.name, 1);
                    label = event.name;
                } else {
                    // relabeling required
                    let newLabelIndex = labelOrderIndex.get(event.name);
                    if (newLabelIndex === undefined) {
                        newLabelIndex = 0;
                    }

                    let relabelingOrder = labelOrder.get(event.name);
                    if (relabelingOrder === undefined) {
                        // relabeling collision
                        relabelingOrder = [];
                        labelOrder.set(event.name, relabelingOrder);
                        newLabelIndex = 0;
                    }

                    if (newLabelIndex >= relabelingOrder.length) {
                        // new label must be generated
                        let newLabel: string;
                        do {
                            newLabel = `${event.name}${labelCounter.next()}`;
                        } while (existingLabels.has(newLabel));
                        existingLabels.add(newLabel);
                        relabelingOrder.push(newLabel);
                        labelMapping.set(newLabel, event.name);
                    }

                    label = relabelingOrder[newLabelIndex];
                    labelOrderIndex.set(event.name, newLabelIndex + 1);
                }


                const t = new Transition(`t${netCounter.next()}`, 0, 0, label);
                net.addTransition(t);
                net.addArc(new Arc(`a${netCounter.next()}`, lastPlace, t, 1));
                lastPlace = new Place(`p${netCounter.next()}`, 0, 0, 0);
                net.addPlace(lastPlace);
                net.addArc(new Arc(`a${netCounter.next()}`, t, lastPlace, 1));
            }

            return net;
        });

        return new TraceConversionResult(nets, labelMapping);
    }

    private relabelNet(net: PetriNet, labelMapping: Map<string, string>): PetriNet {
        net.getTransitions().forEach(t => {
            t.label = labelMapping.get(t.label!)!;
        });
        return net;
    }
}
