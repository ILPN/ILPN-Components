import {Node} from './node';
import {EditableString} from '../../../utility/string-sequence';
import {OwnedValue} from "../../../utility/owned-value";
import {PetriNet} from "./petri-net";


export class Transition extends Node implements EditableString {

    private _label: string | undefined;
    private _foldedPair?: Transition;
    private _renameCallback?: OwnedValue<PetriNet, (o:string | undefined, n:string | undefined) => void>;

    constructor(label?: string, id?: string) {
        super(id);
        this._label = label;
    }

    get label(): string | undefined {
        return this._label;
    }

    get isSilent(): boolean {
        return this._label === undefined;
    }

    set label(value: string | undefined) {
        if (this._renameCallback !== undefined) {
            this._renameCallback.value(this._label, value);
        }
        this._label = value;
    }

    get foldedPair(): Transition | undefined {
        return this._foldedPair;
    }

    set foldedPair(value: Transition | undefined) {
        this._foldedPair = value;
    }

    get renameCallback(): OwnedValue<PetriNet, (o: string | undefined, n: string | undefined) => void> | undefined {
        return this._renameCallback;
    }

    set renameCallback(ownedCallback: OwnedValue<PetriNet, (o: string | undefined, n: string | undefined) => void> | undefined) {
        this._renameCallback = ownedCallback;
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
