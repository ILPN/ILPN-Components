
/**
 * @returns a \ b
 */
export function setDifference<T>(a: Set<T>, b: Set<T>): Set<T> {
    const dif = new Set<T>(a);
    for (const e of b.values()) {
        dif.delete(e);
    }
    return dif;
}
