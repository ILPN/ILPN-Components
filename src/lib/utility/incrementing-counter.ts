export class IncrementingCounter {
    private value = 0;
    public next(): number {
        return this.value++;
    }
}

export function createUniqueName(prefix: string, existingNames: Set<string>, counter: IncrementingCounter): string {
    let name;
    do {
        name = `${prefix}${counter.next()}`;
    } while (existingNames.has(name));
    existingNames.add(name);
    return name;
}
