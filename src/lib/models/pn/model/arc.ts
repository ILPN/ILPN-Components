import {Node} from './node';
import {Identifiable} from '../../../utility/identifiable';


export class Arc extends Identifiable {
    private readonly _source: Node;
    private readonly _destination: Node;
    private _weight: number;

    constructor(id: string, source: Node, destination: Node, weight: number = 1) {
        super(id);
        this._source = source;
        this._destination = destination;
        this._weight = weight;
        this._source.addOutgoingArc(this);
        this._destination.addIngoingArc(this);
    }

    get sourceId(): string {
        return this._source.getId();
    }

    get destinationId(): string {
        return this._destination.getId();
    }

    get source(): Node {
        return this._source;
    }

    get destination(): Node {
        return this._destination;
    }

    get weight(): number {
        return this._weight;
    }

    set weight(value: number) {
        this._weight = value;
    }
}
