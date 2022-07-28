export class OccurrenceMatrix {
    private readonly _matrix: {
        [k: string]: {
            [k: string]: number
        }
    };

    private readonly _keys: Set<string>;

    constructor() {
        this._matrix = {};
        this._keys = new Set<string>();
    }

    get keys(): Set<string> {
        return this._keys;
    }

    public add(e1: string, e2: string) {
        const row = this._matrix[e1];
        if (row === undefined) {
            this._matrix[e1] = {[e2]: 1};
            return;
        }
        row[e2] = (row[e2] ?? 0) + 1;
        this._keys.add(e1);
        this._keys.add(e2);
    }

    public get(e1: string, e2: string): boolean {
        const row = this._matrix[e1];
        if (row === undefined) {
            return false;
        }
        return !!row[e2];
    }
}
