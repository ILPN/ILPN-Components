import {Relabeler} from '../../../utility/relabeler';

export class ConcurrencyRelation {

    private _relabeler: Relabeler;

    public isConcurrent(labelA: string, labelB: string): boolean {
        // TODO
        return false;
    }

    get relabeler(): Relabeler {
        return this._relabeler;
    }
}
