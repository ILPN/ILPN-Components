import {Relabeler} from '../../../utility/relabeler';
import {OccurrenceMatrix} from '../../../algorithms/log/concurrency-oracle/alpha-oracle/occurrence-matrix';

export class ConcurrencyRelation {

    private readonly _relabeler: Relabeler;
    private readonly _concurrencyMatrix: {
        [k: string]: {
            [k: string]: boolean;
        }
    }

    protected constructor(relabeler: Relabeler) {
        this._concurrencyMatrix = {};
        this._relabeler = relabeler.clone();
    }

    public static noConcurrency(): ConcurrencyRelation {
        return new ConcurrencyRelation(new Relabeler());
    }

    public static fromOccurrenceMatrix(matrix: OccurrenceMatrix, relabeler: Relabeler): ConcurrencyRelation {
        const result = new ConcurrencyRelation(relabeler);

        const keys = Array.from(matrix.keys);
        for (let i = 0; i < keys.length; i++) {
            const k1 = keys[i];
            for (let j = i + 1; j < keys.length; j++) {
                const k2 = keys[j];
                if (matrix.get(k1, k2) && matrix.get(k2, k1)) {
                    result.setConcurrent(k1, k2);
                }
            }
        }

        return result;
    }

    public isConcurrent(uniqueLabelA: string, uniqueLabelB: string): boolean {
        const row = this._concurrencyMatrix[uniqueLabelA];
        if (row === undefined) {
            return false;
        }
        return !!row[uniqueLabelB];
    }

    public setConcurrent(uniqueLabelA: string, uniqueLabelB: string, concurrency: boolean = true) {
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
