import {Arc} from './arc';
import {IdPoint} from './id-point';

export class Node extends IdPoint {

    private readonly _ingoingArcs: Array<Arc>;
    private readonly _outgoingArcs: Array<Arc>;

    private readonly _ingoingArcWeights: Map<string, number>;
    private readonly _outgoingArcWeights: Map<string, number>;

    constructor(id: string, x: number, y: number) {
        super(id, x, y);
        this._ingoingArcs = [];
        this._outgoingArcs = [];
        this._ingoingArcWeights = new Map<string, number>();
        this._outgoingArcWeights = new Map<string, number>();
    }

    get ingoingArcs(): Array<Arc> {
        return this._ingoingArcs;
    }

    get outgoingArcs(): Array<Arc> {
        return this._outgoingArcs;
    }

    public addOutgoingArc(arc: Arc) {
        this._outgoingArcs.push(arc);
        this._outgoingArcWeights.set(arc.destinationId, arc.weight);
    }

    public addIngoingArc(arc: Arc) {
        this._ingoingArcs.push(arc);
        this._ingoingArcWeights.set(arc.sourceId, arc.weight);
    }
}
