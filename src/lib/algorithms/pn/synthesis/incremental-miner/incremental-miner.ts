import {BehaviorSubject, concatMap, EMPTY, filter, from, map, Observable, of, Subscription} from 'rxjs';
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
        if (input.hasNoMissingIndices()) {
            // the requested net was cached
            return of(input.model);
        }

        const minerInput$ = new BehaviorSubject<IncrementalMinerInput>(input);
        return minerInput$.pipe(
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
            }),
            map((result: {result: SynthesisResult, input: IncrementalMinerInput, changed?: boolean}) => {
                console.debug(`Iteration completed`, result);

                let synthesisedNet = result.result.result;
                const r: Array<PetriNet> = []; // an empty array can be filtered out, without adding undefined to the content of the observable
                if (result.changed) {
                    synthesisedNet = this._implicitPlaceRemover.removeImplicitPlaces(synthesisedNet);
                    r.push(synthesisedNet);
                }

                if (input.hasNoMissingIndices()) {
                    minerInput$.complete();
                } else {
                    minerInput$.next(this.addMissingTrace(synthesisedNet, input.missingIndices));
                }
                return r;
            }),
            filter(a => a.length > 0),
            concatMap(a => from(a))
        );
    }

    private createMinerInput(requestedIndices: Set<number>): IncrementalMinerInput {
        const cached = this._cache.get(requestedIndices);
        if (cached.key.size === requestedIndices.size) {
            // exact match
            return new IncrementalMinerInput(cached.value, new PetriNet());
        }
        const missing = Array.from(setDifference(requestedIndices, cached.key));
        return this.addMissingTrace(cached.value, missing);
    }

    private addMissingTrace(model: PetriNet, missing: Array<number>): IncrementalMinerInput {
        const index = missing.pop()!;
        const cached = this._cache.get(new Set<number>([index]))
        return new IncrementalMinerInput(model, cached.value, missing);
    }
}
