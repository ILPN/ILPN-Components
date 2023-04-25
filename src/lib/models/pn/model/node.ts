import {Arc} from './arc';
import {getByValueId, Identifiable} from '../../../utility/identifiable';

export class Node extends Identifiable {

    private readonly _ingoingArcs: Map<string, Arc>;
    private readonly _outgoingArcs: Map<string, Arc>;

    private readonly _ingoingArcWeights: Map<string, number>;
    private readonly _outgoingArcWeights: Map<string, number>;

    constructor(id?: string) {
        super(id);
        this._ingoingArcs = new Map<string, Arc>();
        this._outgoingArcs = new Map<string, Arc>();
        this._ingoingArcWeights = new Map<string, number>();
        this._outgoingArcWeights = new Map<string, number>();
    }

    get ingoingArcs(): Array<Arc> {
        return Array.from(this._ingoingArcs.values());
    }

    get outgoingArcs(): Array<Arc> {
        return Array.from(this._outgoingArcs.values());
    }

    get ingoingArcWeights(): Map<string, number> {
        return this._ingoingArcWeights;
    }

    get outgoingArcWeights(): Map<string, number> {
        return this._outgoingArcWeights;
    }

    public addOutgoingArc(arc: Arc) {
        this._outgoingArcs.set(arc.getId(), arc);
        this._outgoingArcWeights.set(arc.destinationId, arc.weight);
    }

    public addIngoingArc(arc: Arc) {
        this._ingoingArcs.set(arc.getId(), arc);
        this._ingoingArcWeights.set(arc.sourceId, arc.weight);
    }

    public removeArc(arc: Arc | string) {
        let a = getByValueId(this._ingoingArcs, arc);
        if (a !== undefined) {
            this._ingoingArcs.delete(a.getId());
            this._ingoingArcWeights.delete(a.sourceId);
        }
        a = getByValueId(this._outgoingArcs, arc);
        if (a !== undefined) {
            this._outgoingArcs.delete(a.getId());
            this._outgoingArcWeights.delete(a.destinationId);
        }
    }
}
