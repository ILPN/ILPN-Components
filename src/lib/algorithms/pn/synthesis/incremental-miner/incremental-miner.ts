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

    public mine(domainSubsetIndices: Set<number>, config: RegionsConfiguration = {}): Observable<PetriNet> {
        if (domainSubsetIndices.size === 0) {
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
        ).subscribe((result: {result: SynthesisResult, input: IncrementalMinerInput, changed?: boolean}) => {
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

    private createMinerInput(requestedIndices: Set<number>): IncrementalMinerInput | PetriNet {
        const cached = this._cache.get(requestedIndices);
        if (cached.key.size === requestedIndices.size) {
            // exact match
            return cached.value;
        }
        const missing = Array.from(setDifference(requestedIndices, cached.key));
        return this.addMissingTrace(cached.value, cached.key, missing);
    }

    private addMissingTrace(model: PetriNet, containedIndices: Set<number>, missing: Array<number>): IncrementalMinerInput {
        const index = missing.pop()!;
        const cached = this._cache.get(new Set<number>([index]))
        const newIndices = new Set<number>(containedIndices);
        newIndices.add(index);
        return new IncrementalMinerInput(model, cached.value, newIndices, missing);
    }
}
