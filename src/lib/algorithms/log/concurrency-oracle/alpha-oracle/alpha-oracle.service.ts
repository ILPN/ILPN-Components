import {Injectable} from '@angular/core';
import {ConcurrencyOracle} from '../concurrency-oracle';
import {Trace} from '../../../../models/log/model/trace';;
import {AlphaOracleConfiguration} from './alpha-oracle-configuration';
import {OccurrenceMatrix} from './occurrence-matrix';
import {ConcurrencyRelation} from '../../../../models/concurrency/model/concurrency-relation';
import {LogCleaner} from '../../log-cleaner';
import {Relabeler} from '../../../../utility/relabeler';


@Injectable({
    providedIn: 'root'
})
export class AlphaOracleService extends LogCleaner implements ConcurrencyOracle {

    constructor() {
        super();
    }

    determineConcurrency(log: Array<Trace>, config: AlphaOracleConfiguration = {}): ConcurrencyRelation {
        if (log.length === 0) {
            return ConcurrencyRelation.noConcurrency();
        }

        const cleanedLog = this.cleanLog(log);

        // TODO don't always relabel
        const relabeler = new Relabeler();
        relabeler.uniquelyRelabelSequences(cleanedLog);

        const matrix = this.computeOccurrenceMatrix(cleanedLog, config.lookAheadDistance);

        return ConcurrencyRelation.fromOccurrenceMatrix(matrix, relabeler);
    }

    public computeOccurrenceMatrix(log: Array<Trace>, lookAheadDistance: number = 1, cleanLog: boolean = false): OccurrenceMatrix {
        const matrix = new OccurrenceMatrix();

        if (cleanLog) {
            log = this.cleanLog(log);
        }

        for (const trace of log) {
            const prefix: Array<string> = [];
            for (const step of trace.eventNames) {
                if (prefix.length > lookAheadDistance) {
                    prefix.shift();
                }
                for (const e of prefix) {
                    matrix.add(e, step);
                }
                prefix.push(step);
            }
        }

        console.debug(matrix);

        return matrix;
    }
}
