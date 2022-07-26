import {Injectable} from '@angular/core';
import {ConcurrencyOracle} from '../concurrency-oracle';
import {Trace} from '../../../../models/log/model/trace';;
import {AlphaOracleConfiguration} from './alpha-oracle-configuration';
import {OccurrenceMatrix} from './occurrence-matrix';
import {ConcurrencyRelation} from '../../../../models/concurrency/model/concurrency-relation';
import {LogCleaner} from '../../log-cleaner';


@Injectable({
    providedIn: 'root'
})
export class AlphaOracleService extends LogCleaner implements ConcurrencyOracle {

    constructor() {
        super();
    }

    determineConcurrency(log: Array<Trace>, config: AlphaOracleConfiguration = {}): ConcurrencyRelation {
        if (log.length === 0) {
            return new ConcurrencyRelation();
        }

        const cleanedLog = this.cleanLog(log);
        // TODO relabel log

        const matrix = new OccurrenceMatrix();
        const lookAheadDistance = config.lookAheadDistance ?? 1;

        for (const trace of cleanedLog) {
            const prefix: Array<string> = [];
            for (const step of trace.eventNames) {
                if (prefix.length > lookAheadDistance) {
                    prefix.shift();
                }
                for (const e of prefix) {
                    matrix.set(e, step);
                }
                prefix.push(step);
            }
        }

        console.debug(matrix);
        // TODO create concurrency relation
    }
}
