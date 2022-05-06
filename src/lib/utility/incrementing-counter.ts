export class IncrementingCounter {
    private value = 0;
    public next(): number {
        return this.value++;
    }
}
