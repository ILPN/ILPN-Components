export interface ConcurrencyMatrix {
    [k: string]: {
        [k: string]: boolean | number;
    }
}

export interface ConcurrencyMatrices {
    unique: ConcurrencyMatrix,
    wildcard: ConcurrencyMatrix,
    mixed: ConcurrencyMatrix
}
