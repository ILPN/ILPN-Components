import {BehaviorSubject, concatMap, EMPTY, map, Observable, of, ReplaySubject, Subscription} from 'rxjs';
import {PetriNet} from '../../../../models/pn/model/petri-net';
import {PetriNetRegionSynthesisService} from '../../regions/petri-net-region-synthesis.service';
import {ImplicitPlaceRemoverService} from '../../transformation/implicit-place-remover.service';
import {LpoFireValidator} from '../../validation/lpo-fire-validator';
import {
    PetriNetToPartialOrderTransformerService
} from '../../transformation/petri-net-to-partial-order-transformer.service';
import {SynthesisResult} from '../../regions/classes/synthesis-result';
import {RegionsConfiguration} from '../../../../utility/glpk/model/regions-configuration';
import {IncrementalMinerCache} from './cache/incremental-miner-cache';
import {IncrementalMinerInput} from './incremental-miner-input';
import {setDifference} from '../../../../utility/set-operations';


export class IncrementalMiner {

    private _cache: IncrementalMinerCache;
    private _sub: Subscription;

    constructor(protected _domain$: Observable<Array<PetriNet>>,
                protected _synthesisService: PetriNetRegionSynthesisService,
                protected _implicitPlaceRemover: ImplicitPlaceRemoverService,
                protected _pnToPoTransformer: PetriNetToPartialOrderTransformerService) {
        this._cache = new IncrementalMinerCache([]);
        this._sub = this._domain$.subscribe(domain => {
            this._cache = new IncrementalMinerCache(domain);
        });
    }

    /**
     * Mines a Petri net from the specified indices of the current domain.
     * Cached results are reused to reduce the number of necessary iterations.
     * The fire heuristic is used to reduce the number of necessary iterations.
     *
     * @param domainSubsetIndices a sorted array of the domain indices that must be included in the result
     * @param config region configuration
     */
    public mine(domainSubsetIndices: Array<number>, config: RegionsConfiguration = {}): Observable<PetriNet> {
        if (domainSubsetIndices.length === 0) {
            console.error('Miner input must be non empty');
            return EMPTY;
        }

        // prepare initial input
        const input = this.createMinerInput(domainSubsetIndices);
        if (input instanceof PetriNet) {
            // the requested net was cached
            return of(input);
        }

        const result$ = new ReplaySubject<PetriNet>(1);
        const minerInput$ = new BehaviorSubject<IncrementalMinerInput>(input);

        minerInput$.pipe(
            concatMap(nextInput => {
                // fire PO
                const po = this._pnToPoTransformer.transform(nextInput.partialOrder);
                let mustSynthesise;
                try {
                    const validator = new LpoFireValidator(nextInput.model, po);
                    mustSynthesise = validator.validate().some(r => !r.valid);
                } catch (e) {
                    mustSynthesise = true;
                }

                if (mustSynthesise) {
                    return this._synthesisService.synthesise([nextInput.model, nextInput.partialOrder], config).pipe(map(
                        result => ({
                            result,
                            input: nextInput,
                            changed: true
                        })
                    ));
                } else {
                    return of({
                        result: new SynthesisResult([nextInput.model], nextInput.model),
                        input: nextInput
                    });
                }
            })
        ).subscribe((result: { result: SynthesisResult, input: IncrementalMinerInput, changed?: boolean }) => {
            console.debug(`Iteration completed`, result);

            let synthesisedNet = result.result.result;
            if (result.changed) {
                synthesisedNet = this._implicitPlaceRemover.removeImplicitPlaces(synthesisedNet);
            }

            if (input.hasNoMissingIndices()) {
                this._cache.put(domainSubsetIndices, synthesisedNet);
                minerInput$.complete();
                result$.next(synthesisedNet);
                result$.complete();
            } else {
                this._cache.put(input.containedIndices, synthesisedNet);
                minerInput$.next(this.addMissingTrace(synthesisedNet, input.containedIndices, input.missingIndices));
            }
        });

        return result$.asObservable();
    }

    private createMinerInput(requestedIndices: Array<number>): IncrementalMinerInput | PetriNet {
        const cached = this._cache.get(requestedIndices);
        if (cached.key.length === requestedIndices.length) {
            // exact match
            return cached.value;
        }
        const missing = Array.from(setDifference(new Set(requestedIndices), new Set(cached.key))).sort((a, b) => a - b);
        return this.addMissingTrace(cached.value, cached.key, missing);
    }

    private addMissingTrace(model: PetriNet, containedIndices: Array<number>, missing: Array<number>): IncrementalMinerInput {
        const index = missing.shift()!;
        const cached = this._cache.get([index])
        return new IncrementalMinerInput(model, cached.value, [...containedIndices, index], missing);
    }
}
