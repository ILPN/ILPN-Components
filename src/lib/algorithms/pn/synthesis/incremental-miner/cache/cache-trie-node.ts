import {PetriNet} from '../../../../../models/pn/model/petri-net';


export class CacheTrieNode {
    public net?: PetriNet;
    private _cardinality?: number;
    private readonly _children: Array<CacheTrieNode>;
    private readonly _maxCardinalities: Array<number>;

    constructor() {
        this._children = [];
        this._maxCardinalities = [];
    }

    public hasChild(index: number): boolean {
        return !!this._children[index];
    }

    public getChild(index:number): CacheTrieNode {
        return this._children[index];
    }

    public getPotentialCardinality(index: number): number {
        return this._maxCardinalities[index] ?? 0;
    }

    public getCardinality(): number {
        return this._cardinality ?? 0;
    }

    public insertChild(key: Array<number>, value: PetriNet, i: number = 0) {
        if (i === key.length) {
            if (this.net !== undefined) {
                console.warn(`Cache entry with key '${key}' already exists! Overwriting...`);
            }
            this.net = value;
            this._cardinality = key.length;
            return;
        }
        // else
        const index = key[i];
        let child = this.getChild(index);
        if (child === undefined) {
            child = new CacheTrieNode();
            this._children[index] = child;
        }
        this.updateChildCardinality(index, key.length);
        child.insertChild(key, value, i + 1);
    }

    private updateChildCardinality(index: number, cardinality: number) {
        if ((this._maxCardinalities[index] ?? 0) < cardinality) {
            this._maxCardinalities[index] = cardinality;
        }
    }
}
