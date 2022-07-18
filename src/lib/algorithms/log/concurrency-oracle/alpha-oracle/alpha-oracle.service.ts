import {Injectable} from '@angular/core';
import {ConcurrencyOracle} from '../concurrency-oracle';
import {Trace} from '../../../../models/log/model/trace';
import {Observable, of} from 'rxjs';
import {PetriNet} from '../../../../models/pn/model/petri-net';

@Injectable({
    providedIn: 'root'
})
export class AlphaOracleService implements ConcurrencyOracle {

    constructor() {
    }

    determineConcurrency(log: Array<Trace>): Observable<Array<PetriNet>> {
        return of([]);
    }
}
