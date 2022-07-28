export function iterate<T>(iterable: Iterable<T>, consumer: (value: T) => void) {
    const iterator = iterable[Symbol.iterator]();
    let it = iterator.next();
    while (!it.done) {
        consumer(it.value);
        it = iterator.next();
    }
}
