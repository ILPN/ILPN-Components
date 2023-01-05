import {Identifiable} from '../../../../../utility/get-by-id';
import {Point} from '../../../../../utility/svg/point';
import {MouseListener} from '../../../../../models/pn/model/mouse-listener';
import {BehaviorSubject, Observable, Subject, Subscription} from 'rxjs';
import {TEXT_STYLE} from '../../constants/text-style';


export abstract class SvgWrapper extends Identifiable implements Point, MouseListener {

    protected readonly TEXT_OFFSET = 20;

    protected _center$: BehaviorSubject<Point>;

    private _dragging = false;
    private _lastPoint: Point | undefined;
    private _mainElement: SVGElement | undefined;
    protected _elements: Array<SVGElement> = [];
    private _preDragPosition: Point;
    private _svgOffset: Point | undefined;

    private _layerNodes: Array<SvgWrapper> | undefined;
    private _layerIndex: number | undefined;

    private _subs: Array<Subscription>;

    protected constructor(id?: string) {
        super(id);
        this._center$ = new BehaviorSubject<Point>({x: 0, y: 0});
        this._preDragPosition = {x: 0, y: 0};
        this._subs = [
            this._center$.subscribe(_ => this.updateSVG())
        ];
    }

    get x(): number {
        return this._center$.value.x;
    }

    get y(): number {
        return this._center$.value.y;
    }

    get center(): Point {
        return this._center$.value;
    }

    get center$(): Observable<Point> {
        return this._center$.asObservable();
    }

    set center(point: Point) {
        this._center$.next(point);
    }

    protected svgX(): string {
        return 'x';
    }

    protected svgY(): string {
        return 'y';
    }

    public destroy() {
        this._subs.forEach(s => s.unsubscribe());
    }

    public getElements(): Array<SVGElement> {
        return [...this._elements];
    }

    bindEvents(mouseMoved$: Subject<MouseEvent>, mouseUp$: Subject<MouseEvent>): void {
        this._subs.push(
            mouseMoved$.asObservable().subscribe(e => this.processMouseMoved(e)),
            mouseUp$.asObservable().subscribe(() => this.processMouseUp())
        );
    }

    public processMouseDown(event: MouseEvent) {
        if (this._mainElement === undefined) {
            return;
        }
        event.stopPropagation();
        this._dragging = true;
        this._preDragPosition = this.center;
        this._svgOffset = this.svgOffset();
        this._lastPoint = {x: event.x, y: event.y};
    }

    public processMouseUp() {
        if (this._mainElement === undefined || !this._dragging) {
            return;
        }

        this._dragging = false;
        this._lastPoint = undefined;
        this.center = {x: this._preDragPosition.x, y: this._preDragPosition.y}
    }

    public processMouseMoved(event: MouseEvent) {
        if (!this._dragging || this._mainElement === undefined || this._lastPoint === undefined) {
            return;
        }

        const y = this.y + event.y - this._lastPoint.y;
        this._lastPoint.x = event.x;
        this._lastPoint.y = event.y;
        this.center = {x: this.x, y};

        if (this._layerNodes === undefined || this._layerIndex === undefined) {
            return;
        }
        const step = Math.sign(this.y - this._preDragPosition.y);
        if (step === 0) {
            return;
        }
        const neighbourIndex = this._layerIndex + step;
        if (neighbourIndex < 0 || neighbourIndex >= this._layerNodes.length) {
            return;
        }
        if (
            (step < 0 && this.y < this._layerNodes[neighbourIndex].y)
            || (step > 0 && this.y > this._layerNodes[neighbourIndex].y)
        ) {
            this.swap(neighbourIndex);
        }
    }

    public registerMainElement(element: SVGElement) {
        this._mainElement = element;
        this._mainElement.onmousedown = (event) => {
            this.processMouseDown(event);
        };
    }

    public registerLayer(layer: Array<SvgWrapper>, index: number) {
        this._layerNodes = layer;
        this._layerIndex = index;
    }

    private updateSVG() {
        if (this._mainElement === undefined || this._svgOffset === undefined) {
            return;
        }
        this._mainElement.setAttribute(this.svgX(), `${this.x + this._svgOffset.x}`)
        this._mainElement.setAttribute(this.svgY(), `${this.y + this._svgOffset.y}`)
    }

    private svgOffset(): Point {
        if (this._mainElement === undefined) {
            throw new Error('Element not set. SVG offset cannot be computed!');
        }
        return {
            x: parseInt(this._mainElement.getAttribute(this.svgX()) ?? '0') - this.x,
            y: parseInt(this._mainElement.getAttribute(this.svgY()) ?? '0') - this.y
        };
    }

    private swap(newIndex: number) {
        if (this._layerNodes === undefined || this._layerIndex === undefined) {
            return;
        }

        const neighbour = this._layerNodes[newIndex];
        const neighbourPos = {x: neighbour.x, y: neighbour.y};

        neighbour.center = {x: this._preDragPosition.x, y: this._preDragPosition.y};
        this._preDragPosition = neighbourPos;

        this._layerNodes[this._layerIndex] = neighbour;
        this._layerNodes[newIndex] = this;
        neighbour._layerIndex = this._layerIndex;
        this._layerIndex = newIndex;
    }

    protected createSvgElement(name: string): SVGElement {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }

    protected createTextElement(content?: string): SVGElement {
        const result = this.createSvgElement('text');
        this.applyStyle(result, TEXT_STYLE);
        if (content !== undefined) {
            result.textContent = content;
        }
        return result;
    }

    protected applyStyle(element: SVGElement, style: object) {
        for (const entry of Object.entries(style)) {
            element.setAttribute(entry[0], entry[1]);
        }
    }
}
