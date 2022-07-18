import {Injectable} from '@angular/core';
import {ConcurrencyOracle} from '../concurrency-oracle';
import {Trace} from '../../../../models/log/model/trace';
import {Observable, of} from 'rxjs';
import {PetriNet} from '../../../../models/pn/model/petri-net';
import {AlphaOracleConfiguration} from './alpha-oracle-configuration';

interface OccurrenceMatrix {
    [k: string]: {
        [k: string]: boolean
    }
}

@Injectable({
    providedIn: 'root'
})
export class AlphaOracleService implements ConcurrencyOracle {

    constructor() {
    }

    determineConcurrency(log: Array<Trace>, config: AlphaOracleConfiguration = {}): Observable<Array<PetriNet>> {
        const occurrenceMatrix = this.computeOccurrenceMatrix(log, config.lookAheadDistance);



        return of([]);
    }

    private computeOccurrenceMatrix(log: Array<Trace>, lookAheadDistance: number = 1): OccurrenceMatrix {
        const matrix: OccurrenceMatrix = {};
        if (lookAheadDistance <= 0) {
            return matrix;
        }

        for (const trace of log) {
            for (let i = 0; i < trace.length(); i++) {
                const e = trace.get(i);
                for (let j = i + 1; j < trace.length() && j <= i + lookAheadDistance; j++) {
                    this.insert(matrix, e, trace.get(j));
                }
            }
        }
        return matrix;
    }

    private insert(matrix: OccurrenceMatrix, e1: string, e2: string, value: boolean = true) {
        const row = matrix[e1];
        if (row === undefined) {
            matrix[e1] = {[e2]: value};
        }
        row[e2] = value;
    }

    private read(matrix: OccurrenceMatrix, e1: string, e2: string): boolean {
        const row = matrix[e1];
        if (row === undefined) {
            return false;
        }
        return !!row[e2];
    }
}
