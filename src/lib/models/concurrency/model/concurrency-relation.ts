import {Relabeler} from '../../../utility/relabeler';
import {OccurrenceMatrix} from '../../../algorithms/log/concurrency-oracle/alpha-oracle/occurrence-matrix';

export class ConcurrencyRelation {

    private _relabeler: Relabeler;

    private _concurrencyMatrix: {
        [k: string]: {
            [k: string]: boolean;
        }
    }

    protected constructor() {
        this._concurrencyMatrix = {};
    }

    public static noConcurrency(): ConcurrencyRelation {
        return new ConcurrencyRelation();
    }

    public static fromOccurrenceMatrix(matrix: OccurrenceMatrix): ConcurrencyRelation {

    }


    public isConcurrent(uniqueLabelA: string, uniqueLabelB: string): boolean {
        const row = this._concurrencyMatrix[uniqueLabelA];
        if (row === undefined) {
            return false;
        }
        return !!row[uniqueLabelB];
    }

    protected setConcurrent(uniqueLabelA: string, uniqueLabelB: string, concurrency: boolean = true) {
        this.set(uniqueLabelA, uniqueLabelB, concurrency);
        this.set(uniqueLabelB, uniqueLabelA, concurrency);
    }

    private set(uniqueLabelA: string, uniqueLabelB: string, concurrency: boolean = true) {
        const row = this._concurrencyMatrix[uniqueLabelA];
        if (row === undefined) {
            this._concurrencyMatrix[uniqueLabelA] = {[uniqueLabelB]: concurrency};
            return;
        }
        row[uniqueLabelB] = concurrency;
    }

    get relabeler(): Relabeler {
        return this._relabeler;
    }
}
