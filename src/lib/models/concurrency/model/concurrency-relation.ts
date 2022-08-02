import {Relabeler} from '../../../utility/relabeler';
import {OccurrenceMatrix} from '../../../algorithms/log/concurrency-oracle/alpha-oracle/occurrence-matrix';

interface ConcurrencyMatrix {
    [k: string]: {
        [k: string]: boolean;
    }
}

export class ConcurrencyRelation {

    private readonly _relabeler: Relabeler;
    private readonly _uniqueConcurrencyMatrix: ConcurrencyMatrix;
    private readonly _wildcardConcurrencyMatrix: ConcurrencyMatrix;

    protected constructor(relabeler: Relabeler) {
        this._uniqueConcurrencyMatrix = {};
        this._wildcardConcurrencyMatrix = {};
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
                    result.setUniqueConcurrent(k1, k2);
                }
            }
        }

        return result;
    }

    public isConcurrent(labelA: string, labelB: string): boolean {
        // unique
        let row = this._uniqueConcurrencyMatrix[labelA];
        if (row !== undefined) {
            return !!row[labelB];
        }

        // wildcard
        row = this._wildcardConcurrencyMatrix[labelA];
        if (row === undefined) {
            return false;
        }
        return !!row[labelB];
    }

    public setUniqueConcurrent(uniqueLabelA: string, uniqueLabelB: string, concurrency: boolean = true) {
        this.set(this._uniqueConcurrencyMatrix, uniqueLabelA, uniqueLabelB, concurrency);
        this.set(this._uniqueConcurrencyMatrix, uniqueLabelB, uniqueLabelA, concurrency);
    }

    public setWildcardConcurrent(wildcardLabelA: string, wildcardLabelB: string, concurrency: boolean = true) {
        this.set(this._wildcardConcurrencyMatrix, wildcardLabelA, wildcardLabelB, concurrency);
        this.set(this._wildcardConcurrencyMatrix, wildcardLabelB, wildcardLabelA, concurrency);
    }

    protected set(matrix: ConcurrencyMatrix, uniqueLabelA: string, uniqueLabelB: string, concurrency: boolean = true) {
        const row = matrix[uniqueLabelA];
        if (row === undefined) {
            matrix[uniqueLabelA] = {[uniqueLabelB]: concurrency};
            return;
        }
        row[uniqueLabelB] = concurrency;
    }

    get relabeler(): Relabeler {
        return this._relabeler;
    }
}
