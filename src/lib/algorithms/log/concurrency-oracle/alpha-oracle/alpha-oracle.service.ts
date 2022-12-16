import {Injectable} from '@angular/core';
import {ConcurrencyOracle} from '../concurrency-oracle';
import {Trace} from '../../../../models/log/model/trace';
import {AlphaOracleConfiguration} from './alpha-oracle-configuration';
import {OccurenceMatrixType, OccurrenceMatrix} from '../occurrence-matrix';
import {ConcurrencyRelation} from '../../../../models/concurrency/model/concurrency-relation';
import {Relabeler} from '../../../../utility/relabeler';
import {cleanLog} from '../../clean-log';


@Injectable({
    providedIn: 'root'
})
export class AlphaOracleService implements ConcurrencyOracle {

    determineConcurrency(log: Array<Trace>, config: AlphaOracleConfiguration = {}): ConcurrencyRelation {
        if (log.length === 0) {
            return ConcurrencyRelation.noConcurrency();
        }

        const cleanedLog = cleanLog(log);

        const relabeler = new Relabeler();
        if (!!config.distinguishSameLabels) {
            relabeler.uniquelyRelabelSequences(cleanedLog);
        } else {
            relabeler.relabelSequencesPreserveNonUniqueIdentities(cleanedLog);
        }

        const matrix = this.computeOccurrenceMatrix(
            cleanedLog,
            config.lookAheadDistance,
            config.distinguishSameLabels ? OccurenceMatrixType.UNIQUE : OccurenceMatrixType.WILDCARD
        );

        return ConcurrencyRelation.fromOccurrenceMatrix(matrix, relabeler);
    }

    public computeOccurrenceMatrix(log: Array<Trace>, lookAheadDistance: number = 1, matrixType: OccurenceMatrixType = OccurenceMatrixType.UNIQUE, shouldCleanLog: boolean = false): OccurrenceMatrix {
        const matrix = new OccurrenceMatrix(matrixType);

        if (shouldCleanLog) {
            log = cleanLog(log);
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
