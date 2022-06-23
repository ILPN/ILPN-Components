export function arraify<T>(a: T | Array<T>): Array<T> {
    return Array.isArray(a) ? a : [a];
}
