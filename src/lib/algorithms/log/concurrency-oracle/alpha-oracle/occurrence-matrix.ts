export class OccurrenceMatrix {
    private readonly _matrix: {
        [k: string]: {
            [k: string]: boolean
        }
    };

    constructor() {
        this._matrix = {};
    }

    public set(e1: string, e2: string, value: boolean = true) {
        const row = this._matrix[e1];
        if (row === undefined) {
            this._matrix[e1] = {[e2]: value};
            return;
        }
        row[e2] = value;
    }

    public get(e1: string, e2: string): boolean {
        const row = this._matrix[e1];
        if (row === undefined) {
            return false;
        }
        return !!row[e2];
    }
}
