import {Node} from './node';
import {FoldingStatus} from '../../../algorithms/bp/folding/model/folding-status';


export class Place extends Node {

    private _marking: number;
    private _foldingStatus?: FoldingStatus;
    private _foldedPair?: Place;

    constructor(marking: number = 0, id?: string) {
        super(id);
        this._marking = marking;
    }

    get marking(): number {
        return this._marking;
    }

    set marking(value: number) {
        this._marking = value;
    }

    get foldingStatus(): FoldingStatus | undefined {
        return this._foldingStatus;
    }

    set foldingStatus(value: FoldingStatus | undefined) {
        this._foldingStatus = value;
    }

    get foldedPair(): Place | undefined {
        return this._foldedPair;
    }

    set foldedPair(value: Place | undefined) {
        this._foldedPair = value;
    }
}
