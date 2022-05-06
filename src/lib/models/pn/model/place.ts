import {Node} from './node';

export class Place extends Node {

    private _marking: number;

    constructor(id: string, x: number, y: number, marking: number) {
        super(id, x, y);
        this._marking = marking;
    }

    get marking(): number {
        return this._marking;
    }

    set marking(value: number) {
        this._marking = value;
    }

    protected override svgX(): string {
        return 'cx';
    }

    protected override svgY(): string {
        return 'cy';
    }
}
