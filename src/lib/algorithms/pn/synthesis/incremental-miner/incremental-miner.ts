import {BehaviorSubject, concatMap, EMPTY, filter, from, map, Observable, of, Subscription} from 'rxjs';
import {PetriNet} from '../../../../models/pn/model/petri-net';
import {PetriNetRegionSynthesisService} from '../../regions/petri-net-region-synthesis.service';
import {PetriNetIsomorphismService} from '../../isomorphism/petri-net-isomorphism.service';
import {ImplicitPlaceRemoverService} from '../../transformation/implicit-place-remover.service';
import {LpoFireValidator} from '../../validation/lpo-fire-validator';
import {
    PetriNetToPartialOrderTransformerService
} from '../../transformation/petri-net-to-partial-order-transformer.service';
import {SynthesisResult} from '../../regions/classes/synthesis-result';
import {Trace} from '../../../../models/log/model/trace';
import {RegionsConfiguration} from '../../../../utility/glpk/model/regions-configuration';
import {IncrementalMinerCache} from './cache/incremental-miner-cache';
import {IncrementalMinerInput} from './incremental-miner-input';
import {setDifference} from '../../../../utility/set-operations';


export class IncrementalMiner {

    private _cache: IncrementalMinerCache;
    private _sub: Subscription;

    constructor(protected _domain$: Observable<Array<PetriNet>>,
                protected _synthesisService: PetriNetRegionSynthesisService,
                protected _isomorphismService: PetriNetIsomorphismService,
                protected _implicitPlaceRemover: ImplicitPlaceRemoverService,
                protected _pnToPoTransformer: PetriNetToPartialOrderTransformerService) {
        this._cache = new IncrementalMinerCache([]);
        this._sub = this._domain$.subscribe(domain => {
            this._cache = new IncrementalMinerCache(domain);
        });
    }

    public mine(domainSubsetIndices: Set<number>, config: RegionsConfiguration = {}): Observable<PetriNet> {
        if (domainSubsetIndices.size === 0) {
            console.error('Miner input must be non empty');
            return EMPTY;
        }

        // prepare initial input
        const firstPass = this.createMinerInput(new PetriNet(), domainSubsetIndices);
        if (firstPass.hasNoMissingIndices()) {
            // the requested net was cached
            return of(firstPass.netB);
        }

        const input = this.createMinerInput(firstPass.netB, firstPass.missingIndices);

        const minerInput$ = new BehaviorSubject<IncrementalMinerInput>(input);
        // TODO iteration
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
                const r: Array<PrimeMinerResult> = [];

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

    private createMinerInput(runningNet: PetriNet, missingIndices: Set<number>): IncrementalMinerInput {
        const cached = this._cache.get(missingIndices);
        if (cached.key.size === missingIndices.size) {
            // exact match
            return new IncrementalMinerInput(runningNet, cached.value);
        }
        const missing = setDifference(missingIndices, cached.key);
        return new IncrementalMinerInput(runningNet, cached.value, missing);
    }

}
