import {Observable, Subject, takeUntil} from 'rxjs';
import {MouseListener} from './mouse-listener';
import {Point} from './point';
import {Identifiable} from '../../../utility/get-by-id';

export class IdPoint extends Identifiable implements Point, MouseListener {
    private _x: number;
    private _y: number;

    private _dragging = false;
    private _lastPoint: Point | undefined;
    private _element: SVGElement | undefined;
    private _preDragPosition: Point;
    private _svgOffset: Point | undefined;

    private _layerNodes: Array<IdPoint> | undefined;
    private _layerIndex: number | undefined;

    private _redraw$: Subject<void> | undefined;

    constructor(x: number, y: number, id?: string) {
        super(id);
        this._x = x;
        this._y = y;
        this._preDragPosition = {x, y};
    }

    get x(): number {
        return this._x;
    }

    set x(value: number) {
        this._x = value;
    }

    get y(): number {
        return this._y;
    }

    set y(value: number) {
        this._y = value;
    }

    get center(): Point {
        return {x: this.x, y: this.y};
    }

    bindEvents(mouseMoved$: Subject<MouseEvent>, mouseUp$: Subject<MouseEvent>, kill$: Observable<void>, redraw$: Subject<void>): void {
        mouseMoved$.asObservable().pipe(takeUntil(kill$)).subscribe(e => this.processMouseMoved(e));
        mouseUp$.asObservable().pipe(takeUntil(kill$)).subscribe(() => this.processMouseUp());
        this._redraw$ = redraw$;
    }

    public processMouseDown(event: MouseEvent) {
        if (this._element === undefined) {
            return;
        }
        event.stopPropagation();
        this._dragging = true;
        this._preDragPosition = {x: this.x, y: this.y};
        this._svgOffset = this.svgOffset();
        this._lastPoint = {x: event.x, y: event.y};
    }

    public processMouseUp() {
        if (this._element === undefined || !this._dragging) {
            return;
        }

        this._dragging = false;
        this._lastPoint = undefined;
        this.x = this._preDragPosition.x;
        this.y = this._preDragPosition.y;
        this.updateSVG();

        this.redraw();
    }

    public processMouseMoved(event: MouseEvent) {
        if (!this._dragging || this._element === undefined || this._lastPoint === undefined) {
            return;
        }

        this.y += event.y - this._lastPoint.y;
        this._lastPoint.x = event.x;
        this._lastPoint.y = event.y;
        this.updateSVG();

        if (this._layerNodes === undefined || this._layerIndex === undefined) {
            this.redraw();
            return;
        }
        const step = Math.sign(this.y - this._preDragPosition.y);
        if (step === 0) {
            this.redraw();
            return;
        }
        const neighbourIndex = this._layerIndex + step;
        if (neighbourIndex < 0 || neighbourIndex >= this._layerNodes.length) {
            this.redraw();
            return;
        }
        if (
            (step < 0 && this.y < this._layerNodes[neighbourIndex].y)
            || (step > 0 && this.y > this._layerNodes[neighbourIndex].y)
        ) {
            this.swap(neighbourIndex);
        }
        this.redraw();
    }

    public registerElement(element: SVGElement) {
        this._element = element;
        this._element.onmousedown = (event) => {
            this.processMouseDown(event);
        };
    }

    public registerLayer(layer: Array<IdPoint>, index: number) {
        this._layerNodes = layer;
        this._layerIndex = index;
    }

    protected svgX(): string {
        return 'x';
    }

    protected svgY(): string {
        return 'y';
    }

    private updateSVG(offset?: Point) {
        if (this._element === undefined || (this._svgOffset === undefined && offset === undefined)) {
            return;
        }
        const off = offset ?? this._svgOffset;
        this._element.setAttribute(this.svgX(), '' + (this.x + (off as Point).x))
        this._element.setAttribute(this.svgY(), '' + (this.y + (off as Point).y))
    }

    private svgOffset(): Point {
        if (this._element === undefined) {
            throw new Error('Element not set. SVG offset cannot be computed!');
        }
        return {
            x: parseInt(this._element.getAttribute(this.svgX()) ?? '0') - this.x,
            y: parseInt(this._element.getAttribute(this.svgY()) ?? '0') - this.y
        };
    }

    private swap(newIndex: number) {
        if (this._layerNodes === undefined || this._layerIndex === undefined) {
            return;
        }

        const neighbour = this._layerNodes[newIndex];
        const neighbourPos = {x: neighbour.x, y: neighbour.y};
        const offset = neighbour.svgOffset();

        neighbour.x = this._preDragPosition.x;
        neighbour.y = this._preDragPosition.y;
        this._preDragPosition = neighbourPos;

        this._layerNodes[this._layerIndex] = neighbour;
        this._layerNodes[newIndex] = this;
        neighbour._layerIndex = this._layerIndex;
        this._layerIndex = newIndex;

        neighbour.updateSVG(offset);
    }

    private redraw() {
        if (this._redraw$ !== undefined) {
            this._redraw$.next();
        }
    }
}
