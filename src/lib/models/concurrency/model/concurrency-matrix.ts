export interface ConcurrencyMatrix {
    [k: string]: {
        [k: string]: boolean;
    }
}

export interface ConcurrencyMatrices {
    unique: ConcurrencyMatrix,
    wildcard: ConcurrencyMatrix,
    mixed: ConcurrencyMatrix
}
