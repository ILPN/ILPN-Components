export class OwnedValue<O,V> {
    constructor(public owner: O, public value: V) {
    }
}
