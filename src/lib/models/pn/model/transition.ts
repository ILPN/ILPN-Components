import {Node} from './node';

export class Transition extends Node {

    private _label: string | undefined;

    constructor(id: string, x: number, y: number, label?: string) {
        super(id, x, y);
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
