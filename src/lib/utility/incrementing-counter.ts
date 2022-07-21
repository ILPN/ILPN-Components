export class IncrementingCounter {
    private value = 0;
    public next(): number {
        return this.value++;
    }
}

export interface SetLike<T> {
    has(s: T): boolean;
}

export function createUniqueString(prefix: string, existingNames: SetLike<string>, counter: IncrementingCounter): string {
    let result;
    do {
        result = `${prefix}${counter.next()}`;
    } while (existingNames.has(result));
    return result;
}
