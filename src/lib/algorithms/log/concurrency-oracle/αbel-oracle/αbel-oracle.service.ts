import {Injectable} from '@angular/core';
import {Trace} from '../../../../models/log/model/trace';
import {MultisetEquivalentTraces} from '../../../../utility/multiset/multiset-equivalent-traces';
import {PetriNetRegionSynthesisService} from '../../../pn/regions/petri-net-region-synthesis.service';
import {PetriNet} from '../../../../models/pn/model/petri-net';
import {Place} from '../../../../models/pn/model/place';
import {Transition} from '../../../../models/pn/model/transition';
import {forkJoin, map, Observable} from 'rxjs';
import {TraceConversionResult} from './trace-conversion-result';
import {Relabeler} from '../../../../utility/relabeler';
import {LogCleaner} from '../../log-cleaner';
import {
    TraceMultisetEquivalentStateTraverser
} from '../../../../utility/multiset/trace-multiset-equivalent-state-traverser';


@Injectable({
    providedIn: 'root'
})
export class AbelOracleService extends LogCleaner {

    constructor(private _regionSynthesisService: PetriNetRegionSynthesisService) {
        super();
    }

    public determineConcurrency(log: Array<Trace>): Observable<Array<PetriNet>> {
        const multisetEquivalentTraces = this.obtainMultisetEquivalentTraces(log);
        return forkJoin(multisetEquivalentTraces.map(traces => this.computePartialOrderFromEquivalentTraces(traces)));
    }

    private obtainMultisetEquivalentTraces(log: Array<Trace>): Array<MultisetEquivalentTraces> {
        const explorer = new TraceMultisetEquivalentStateTraverser();
        return explorer.traverseMultisetEquivalentStates(log);
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
            const net = new PetriNet();

            let lastPlace = new Place();
            net.addPlace(lastPlace);

            for (const event of trace.events) {
                const t = new Transition(relabeler.getNewUniqueLabel(event.name));
                net.addTransition(t);
                net.addArc(lastPlace, t);
                lastPlace = new Place();
                net.addPlace(lastPlace);
                net.addArc(t, lastPlace);
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
