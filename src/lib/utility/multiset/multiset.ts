export type Multiset = {[k: string]: number};

export function incrementMultisetMultiplicity(multiset: Multiset, value: string) {
    if (multiset[value] === undefined) {
        multiset[value] = 1;
    } else {
        multiset[value] += 1;
    }
}

export function cloneMultiset(multiset: Multiset): Multiset {
    return Object.assign({}, multiset);
}

export function mapMultiset<T>(multiset: Multiset, mappingFunction: (name: string, cardinality: number) => T): Array<T> {
    return Object.entries(multiset).map(entry => mappingFunction(entry[0], entry[1]));
}
