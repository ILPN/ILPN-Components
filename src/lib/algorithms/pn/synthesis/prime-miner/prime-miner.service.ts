import {Injectable} from '@angular/core';
import {BehaviorSubject, concatMap, EMPTY, filter, from, map, Observable, of} from 'rxjs';
import {PetriNet} from '../../../../models/pn/model/petri-net';
import {PetriNetRegionSynthesisService} from '../../regions/petri-net-region-synthesis.service';
import {PrimeMinerResult} from './prime-miner-result';
import {PetriNetIsomorphismService} from '../../isomorphism/petri-net-isomorphism.service';
import {ImplicitPlaceRemoverService} from '../../transformation/implicit-place-remover.service';
import {PartialOrderNetWithContainedTraces} from '../../../../models/pn/model/partial-order-net-with-contained-traces';
import {PrimeMinerInput} from './prime-miner-input';
import {LpoFireValidator} from '../../validation/lpo-fire-validator';
import {
    PetriNetToPartialOrderTransformerService
} from '../../transformation/petri-net-to-partial-order-transformer.service';
import {SynthesisResult} from '../../regions/classes/synthesis-result';
import {Trace} from '../../../../models/log/model/trace';
import {PrimeMinerConfiguration} from './prime-miner-configuration';
import {IlpnAlgorithmsModule} from '../../../ilpn-algorithms.module';


@Injectable({
    providedIn: IlpnAlgorithmsModule
})
export class PrimeMinerService {

    constructor(protected _synthesisService: PetriNetRegionSynthesisService,
                protected _isomorphismService: PetriNetIsomorphismService,
                protected _implicitPlaceRemover: ImplicitPlaceRemoverService,
                protected _pnToPoTransformer: PetriNetToPartialOrderTransformerService) {
    }

    public mine(minerInputs: Array<PartialOrderNetWithContainedTraces>, config: PrimeMinerConfiguration = {}): Observable<PrimeMinerResult> {
        if (minerInputs.length === 0) {
            console.error('Miner input must be non empty');
            return EMPTY;
        }

        minerInputs.sort((a, b) => (b.net?.frequency ?? 0) - (a.net?.frequency ?? 0));

        let bestResult = new PrimeMinerResult(new PetriNet(), [], []);
        let nextInputIndex = 1;

        const minerInput$ = new BehaviorSubject<PrimeMinerInput>(PrimeMinerInput.fromPartialOrder(minerInputs[0], true));
        return minerInput$.pipe(
            concatMap(nextInput => {
                let mustSynthesise = nextInput.lastIterationChangedModel;
                if (!nextInput.lastIterationChangedModel) {
                    const po = this._pnToPoTransformer.transform(nextInput.net);
                    try {
                        const validator = new LpoFireValidator(bestResult.net, po);
                        mustSynthesise = validator.validate().some(r => !r.valid);
                    } catch (e) {
                        mustSynthesise = true;
                    }
                }

                if (mustSynthesise) {
                    return this._synthesisService.synthesise([bestResult.net, nextInput.net], config).pipe(map(
                        result => ({
                            result,
                            containedTraces: [...bestResult.containedTraces, ...nextInput.containedTraces]
                        })
                    ));
                } else {
                    return of({
                        result: new SynthesisResult([bestResult.net], bestResult.net),
                        containedTraces: bestResult.containedTraces,
                        unchanged: true
                    });
                }
            }),
            map((result: {result: SynthesisResult, containedTraces: Array<Trace>, unchanged?: boolean}) => {
                console.debug(`Iteration ${nextInputIndex} completed`, result);

                const synthesisedNet = result.result.result;
                const r: Array<PrimeMinerResult> = []; // an empty array can be filtered out, without adding undefined to the content of the observable

                let changed = !result.unchanged;
                if (changed && (config.skipConnectivityCheck || this.isConnected(synthesisedNet))) {
                    let noImplicit = this._implicitPlaceRemover.removeImplicitPlaces(synthesisedNet);

                    changed = !this._isomorphismService.arePetriNetsIsomorphic(bestResult.net, noImplicit);
                    if (changed && !bestResult.net.isEmpty()) {
                        r.push(bestResult);
                    }

                    bestResult = new PrimeMinerResult(noImplicit, [...bestResult.supportedPoIndices, nextInputIndex], result.containedTraces);
                }

                if (nextInputIndex === minerInputs.length) {
                    r.push(bestResult);
                }

                if (nextInputIndex < minerInputs.length) {
                    minerInput$.next(PrimeMinerInput.fromPartialOrder(minerInputs[nextInputIndex], changed));
                    nextInputIndex++;
                } else {
                    minerInput$.complete();
                }

                console.debug('best running result', bestResult);
                return r;
            }),
            filter(a => a.length > 0),
            concatMap(a => from(a))
        );
    }

    private isConnected(net: PetriNet): boolean {
        return net.getTransitions().every(t => t.ingoingArcs.length > 0);
    }
}
