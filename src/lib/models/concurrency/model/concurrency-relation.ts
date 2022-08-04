import {Relabeler} from '../../../utility/relabeler';
import {
    OccurenceMatrixType,
    OccurrenceMatrix
} from '../../../algorithms/log/concurrency-oracle/alpha-oracle/occurrence-matrix';
import {ConcurrencyMatrices, ConcurrencyMatrix} from './concurrency-matrix';


export class ConcurrencyRelation {

    private readonly _relabeler: Relabeler;
    private readonly _uniqueConcurrencyMatrix: ConcurrencyMatrix;
    private readonly _wildcardConcurrencyMatrix: ConcurrencyMatrix;
    private readonly _mixedConcurrencyMatrix: ConcurrencyMatrix;
    private readonly _wildCardLabels: Set<string>;

    protected constructor(relabeler: Relabeler) {
        this._uniqueConcurrencyMatrix = {};
        this._wildcardConcurrencyMatrix = {};
        this._mixedConcurrencyMatrix = {};
        this._wildCardLabels = new Set<string>();
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
                    switch (matrix.type) {
                        case OccurenceMatrixType.UNIQUE:
                            result.setUniqueConcurrent(k1, k2);
                            break;
                        case OccurenceMatrixType.WILDCARD:
                            result.setWildcardConcurrent(k1, k2);
                            break;
                    }
                }
            }
        }

        return result;
    }

    public isConcurrent(labelA: string, labelB: string): boolean {
        const unique = this.read(this._uniqueConcurrencyMatrix, labelA, labelB);
        if (unique) {
            return true;
        }

        const wildcardA = this.getWildcard(labelA);
        const wildcardB = this.getWildcard(labelB);
        if (!wildcardA && !wildcardB) {
            return false;
        } else if (wildcardA && wildcardB) {
            return this.read(this._wildcardConcurrencyMatrix, wildcardA, wildcardB);
        } else if (wildcardA && !wildcardB) {
            return this.read(this._mixedConcurrencyMatrix, wildcardA, labelB);
        } else {
            return this.read(this._mixedConcurrencyMatrix, wildcardB!, labelA);
        }
    }

    public setUniqueConcurrent(uniqueLabelA: string, uniqueLabelB: string, concurrency: boolean = true) {
        this.set(this._uniqueConcurrencyMatrix, uniqueLabelA, uniqueLabelB, concurrency);
        this.set(this._uniqueConcurrencyMatrix, uniqueLabelB, uniqueLabelA, concurrency);
    }

    public setWildcardConcurrent(wildcardLabelA: string, wildcardLabelB: string, concurrency: boolean = true) {
        this.set(this._wildcardConcurrencyMatrix, wildcardLabelA, wildcardLabelB, concurrency);
        this.set(this._wildcardConcurrencyMatrix, wildcardLabelB, wildcardLabelA, concurrency);
        this._wildCardLabels.add(wildcardLabelA);
        this._wildCardLabels.add(wildcardLabelB);
    }

    public setMixedConcurrent(wildcardLabel: string, uniqueLabel: string, concurrency: boolean = true) {
        this.set(this._mixedConcurrencyMatrix, wildcardLabel, uniqueLabel, concurrency);
        this._wildCardLabels.add(wildcardLabel);
    }

    protected set(matrix: ConcurrencyMatrix, uniqueLabelA: string, uniqueLabelB: string, concurrency: boolean = true) {
        const row = matrix[uniqueLabelA];
        if (row === undefined) {
            matrix[uniqueLabelA] = {[uniqueLabelB]: concurrency};
            return;
        }
        row[uniqueLabelB] = concurrency;
    }

    protected read(matrix: ConcurrencyMatrix, row: string, column: string): boolean {
        const matrixRow = matrix[row];
        if (matrixRow === undefined) {
            return false;
        }
        return !!matrixRow[column];
    }

    protected getWildcard(label: string): string | undefined {
        const undone = this.relabeler.undoLabel(label);
        if (this._wildCardLabels.has(undone)) {
            return undone;
        }
        return undefined;
    }

    get relabeler(): Relabeler {
        return this._relabeler;
    }

    public cloneConcurrencyMatrices(): ConcurrencyMatrices {
        return {
            unique: this.cloneMatrix(this._uniqueConcurrencyMatrix),
            wildcard: this.cloneMatrix(this._wildcardConcurrencyMatrix),
            mixed: this.cloneMatrix(this._mixedConcurrencyMatrix)
        };
    }

    protected cloneMatrix(matrix: ConcurrencyMatrix): ConcurrencyMatrix {
        const result = {};

        for (const row of Object.keys(matrix)) {
            for (const column of Object.keys(matrix[row])) {
                if (!matrix[row][column]) {
                    continue;
                }
                this.set(result, row, column);
            }
        }

        return result;
    }
}

