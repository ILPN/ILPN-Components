import {Node} from './node';

export class Place extends Node {

    private _marking: number;

    constructor(marking: number = 0, x: number = 0, y: number = 0, id?: string) {
        super(x, y, id);
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
