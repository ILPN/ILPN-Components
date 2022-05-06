import {Node} from './node';
import {DragPoint} from './drag-point';
import {MouseListener} from './mouse-listener';
import {Observable, Subject} from 'rxjs';

export class Arc implements MouseListener {
    private readonly _id: string;
    private readonly _source: Node;
    private readonly _destination: Node;
    private _weight: number;
    private readonly _breakpoints: Array<DragPoint>;

    constructor(id: string, source: Node, destination: Node, weight: number) {
        this._id = id;
        this._source = source;
        this._destination = destination;
        this._weight = weight;
        this._breakpoints = [];
        this._source.addOutgoingArc(this);
        this._destination.addIngoingArc(this);
    }

    get id(): string {
        return this._id;
    }

    get sourceId(): string {
        return this._source.id;
    }

    get destinationId(): string {
        return this._destination.id;
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

    get breakpoints(): Array<DragPoint> {
        return this._breakpoints;
    }

    set weight(value: number) {
        this._weight = value;
    }

    get hasBreakpoints(): boolean {
        return this._breakpoints.length > 0;
    }

    get firstBreakpoint(): DragPoint {
        if (this.hasBreakpoints) {
            return this._breakpoints[0];
        }
        throw new Error('Arc has no breakpoints!');
    }

    get lastBreakpoint(): DragPoint {
        if (this.hasBreakpoints) {
            return this._breakpoints[this._breakpoints.length - 1];
        }
        throw new Error('Arc has no breakpoints!');
    }

    public addBreakpoint(point: DragPoint) {
        this._breakpoints.push(point);
        point.addArcRef(this);
    }

    bindEvents(mouseMoved$: Subject<MouseEvent>, mouseUp$: Subject<MouseEvent>, kill$: Observable<void>, redraw$: Subject<void>): void {
        this.breakpoints.forEach(b => {
            b.bindEvents(mouseMoved$, mouseUp$, kill$, redraw$);
        })
    }
}
