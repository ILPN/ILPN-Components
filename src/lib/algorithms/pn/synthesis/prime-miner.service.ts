import {Injectable} from '@angular/core';
import {BehaviorSubject, concatMap, EMPTY, filter, from, map, Observable} from 'rxjs';
import {PetriNet} from '../../../models/pn/model/petri-net';
import {PetriNetRegionSynthesisService} from '../regions/petri-net-region-synthesis.service';
import {RegionsConfiguration} from '../regions/classes/regions-configuration';

@Injectable({
    providedIn: 'root'
})
export class PrimeMinerService {

    constructor(protected _synthesisService: PetriNetRegionSynthesisService) {
    }

    public mine(partialOrders: Array<PetriNet>, config: RegionsConfiguration = {}): Observable<PetriNet> {
        if (partialOrders.length === 0) {
            console.error('Miner input must be non empty');
            return EMPTY;
        }

        partialOrders.sort((a,b) => (b?.frequency ?? 0) - (a?.frequency ?? 0));

        let bestResult = new PetriNet();
        let nextInputIndex = 1;

        const minerInput$ = new BehaviorSubject(partialOrders[0]);
        return minerInput$.pipe(
            concatMap(nextPO => {
                return this._synthesisService.synthesise([bestResult, nextPO], config);
            }),
            map(result => {
                console.debug(`Iteration ${nextInputIndex} completed`, result);

                const r: Array<PetriNet> = [];
                if (this.isConnected(result.result)) {
                    if (this.areIsomorphic(bestResult, result.result)) {
                    } else if (!bestResult.isEmpty()) {
                        r.push(bestResult);
                    }

                    bestResult = result.result;

                    if (nextInputIndex === partialOrders.length) {
                        r.push(bestResult);
                    }
                }

                if (nextInputIndex < partialOrders.length) {
                    minerInput$.next(partialOrders[nextInputIndex]);
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

    private areIsomorphic(a: PetriNet, b: PetriNet): boolean {
        if (a.getPlaces().length !== b.getPlaces().length) {
            return false;
        }
        if (a.getTransitions().length !== b.getTransitions().length) {
            return false
        }
        if (a.getArcs().length !== b.getArcs().length) {
            return false;
        }
        return true; // TODO
    }
}
