import {Trace} from '../../../models/log/model/trace';
import {ConcurrencyRelation} from '../../../models/concurrency/model/concurrency-relation';

export interface ConcurrencyOracle {
    determineConcurrency(log: Array<Trace>): ConcurrencyRelation;
}
