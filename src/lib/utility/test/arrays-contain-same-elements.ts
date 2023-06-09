export function arraysContainSameElements<E>(arr1: Array<E>, arr2: Array<E>): boolean {
    if (arr1.length !== arr2.length) {
        return false;
    }
    const copy = [...arr2];
    for (const el of arr1) {
        const i = copy.findIndex(e => e === el);
        if (i === -1) {
            return false;
        }
        copy.splice(i, 1);
    }
    return true;
}
