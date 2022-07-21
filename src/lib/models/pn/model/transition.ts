import {Node} from './node';

export class Transition extends Node {

    private _label: string | undefined;

    constructor(label?: string, x: number = 0, y: number = 0, id?: string) {
        super(x, y, id);
        this._label = label;
    }

    get label(): string | undefined {
        return this._label;
    }

    get isSilent(): boolean {
        return this._label === undefined;
    }

    set label(value: string | undefined) {
        this._label = value;
    }
}
