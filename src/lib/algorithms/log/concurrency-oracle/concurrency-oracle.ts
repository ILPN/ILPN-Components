import {Trace} from '../../../models/log/model/trace';
import {Observable} from 'rxjs';
import {PetriNet} from '../../../models/pn/model/petri-net';

export interface ConcurrencyOracle {
    determineConcurrency(log: Array<Trace>): Observable<Array<PetriNet>>;
    // TODO alternative method that returns Partial Order instances
}
