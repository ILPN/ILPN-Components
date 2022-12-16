import {Node} from './node';
import {EditableString} from '../../../utility/string-sequence';


export class Transition extends Node implements EditableString {

    private _label: string | undefined;
    private _foldedPair?: Transition;

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

    get foldedPair(): Transition | undefined {
        return this._foldedPair;
    }

    set foldedPair(value: Transition | undefined) {
        this._foldedPair = value;
    }

    getString(): string {
        const l = this.label;
        if (l === undefined) {
            throw new Error('Transition label is undefined');
        }
        return l;
    }

    setString(value: string): void {
        this.label = value;
    }
}
