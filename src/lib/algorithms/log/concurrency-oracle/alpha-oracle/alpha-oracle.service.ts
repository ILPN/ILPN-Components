import {Injectable} from '@angular/core';
import {ConcurrencyOracle} from '../concurrency-oracle';
import {Trace} from '../../../../models/log/model/trace';
import {Observable, of} from 'rxjs';
import {PetriNet} from '../../../../models/pn/model/petri-net';
import {AlphaOracleConfiguration} from './alpha-oracle-configuration';

@Injectable({
    providedIn: 'root'
})
export class AlphaOracleService implements ConcurrencyOracle {

    constructor() {
    }

    determineConcurrency(log: Array<Trace>, config: AlphaOracleConfiguration = {}): Observable<Array<PetriNet>> {
        return of([]);
    }
}
