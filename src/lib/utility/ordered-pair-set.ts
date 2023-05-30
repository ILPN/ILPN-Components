import {Identifiable} from "./identifiable";


export class OrderedPairSet<A extends Identifiable, B extends Identifiable> {

    private readonly _tree: Map<string | undefined, Set<string | undefined>>;

    public constructor() {
        this._tree = new Map<string, Set<string>>();
    }

    public has(a: A, b: B): boolean;
    public has(a: undefined, b: B): boolean;
    public has(a: A, b: undefined): boolean;
    public has(a: A | undefined, b: B | undefined): boolean {
        const seconds = this._tree.get(a?.getId());
        return seconds === undefined || seconds.has(b?.getId());
    }

    public add(a: A, b: B): void;
    public add(a: undefined, b: B): void;
    public add(a: A, b: undefined): void;
    public add(a: A | undefined, b: B | undefined): void {
        const aId = a?.getId();
        const seconds = this._tree.get(aId);
        if (seconds === undefined) {
            this._tree.set(aId, new Set<string | undefined>([b?.getId()]));
        } else {
            seconds.add(b?.getId());
        }
    }

    public delete(a: A, b: B): void;
    public delete(a: undefined, b: B): void;
    public delete(a: A, b: undefined): void;
    public delete(a: A | undefined, b: B | undefined): void {
        const seconds = this._tree.get(a?.getId());
        if (seconds === undefined) {
            return;
        }
        seconds.delete(b?.getId());
    }
}
