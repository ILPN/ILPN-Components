export function iterate<T>(iterable: Iterable<T>, consumer: (value: T) => void) {
    const iterator = iterable[Symbol.iterator]();
    let it = iterator.next();
    while (!it.done) {
        consumer(it.value);
        it = iterator.next();
    }
}

export function iterateMap<C, P>(iterable: Iterable<C>, map: (value: C) => P): Array<P> {
    const r: Array<P> = [];
    iterate(iterable, c => {
        r.push(map(c));
    })
    return r;
}
