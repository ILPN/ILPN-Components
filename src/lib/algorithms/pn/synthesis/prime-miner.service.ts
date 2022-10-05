import {Injectable} from '@angular/core';
import {BehaviorSubject, concatMap, EMPTY, filter, from, map, Observable} from 'rxjs';
import {PetriNet} from '../../../models/pn/model/petri-net';
import {PetriNetRegionSynthesisService} from '../regions/petri-net-region-synthesis.service';
import {RegionsConfiguration} from '../regions/classes/regions-configuration';
import {PrimeMinerResult} from './prime-miner-result';
import {PetriNetIsomorphismService} from '../isomorphism/petri-net-isomorphism.service';
import {ImplicitPlaceRemoverService} from '../transformation/implicit-place-remover.service';
import {PartialOrderNetWithContainedTraces} from '../../../models/pn/model/partial-order-net-with-contained-traces';

@Injectable({
    providedIn: 'root'
})
export class PrimeMinerService {

    constructor(protected _synthesisService: PetriNetRegionSynthesisService,
                protected _isomorphismService: PetriNetIsomorphismService,
                protected _implicitPlaceRemover: ImplicitPlaceRemoverService) {
    }

    public mine(minerInputs: Array<PartialOrderNetWithContainedTraces>, config: RegionsConfiguration = {}): Observable<PrimeMinerResult> {
        if (minerInputs.length === 0) {
            console.error('Miner input must be non empty');
            return EMPTY;
        }

        minerInputs.sort((a, b) => (b.net?.frequency ?? 0) - (a.net?.frequency ?? 0));

        let bestResult = new PrimeMinerResult(new PetriNet(), [], []);
        let nextInputIndex = 1;

        const minerInput$ = new BehaviorSubject(minerInputs[0]);
        return minerInput$.pipe(
            concatMap(nextInput => {
                return this._synthesisService.synthesise([bestResult.net, nextInput.net], config).pipe(map(
                    result => ({result, containedTraces: [...bestResult.containedTraces, ...nextInput.containedTraces]})
                ));
            }),
            map(result => {
                console.debug(`Iteration ${nextInputIndex} completed`, result);

                const synthesisedNet = result.result.result;
                const r: Array<PrimeMinerResult> = [];
                if (this.isConnected(synthesisedNet)) {
                    let noImplicit = this._implicitPlaceRemover.removeImplicitPlaces(synthesisedNet);

                    if (!this._isomorphismService.arePetriNetsIsomorphic(bestResult.net, noImplicit)
                        && !bestResult.net.isEmpty()) {
                        r.push(bestResult);
                    }

                    bestResult = new PrimeMinerResult(noImplicit, [...bestResult.supportedPoIndices, nextInputIndex], result.containedTraces);

                    if (nextInputIndex === minerInputs.length) {
                        r.push(bestResult);
                    }
                }

                if (nextInputIndex < minerInputs.length) {
                    minerInput$.next(minerInputs[nextInputIndex]);
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
