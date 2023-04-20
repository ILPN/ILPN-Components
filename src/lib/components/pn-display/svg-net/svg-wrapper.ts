import {Identifiable} from '../../../utility/get-by-id';
import {Point} from '../../../utility/svg/point';
import {MouseListener} from '../../../utility/svg/mouse-listener';
import {BehaviorSubject, Observable, Subject, Subscription} from 'rxjs';
import {TEXT_STYLE} from '../internals/constants/text-style';


export abstract class SvgWrapper extends Identifiable implements Point, MouseListener {

    protected static readonly CSS_DRAGGABLE = 'draggable';
    protected static readonly CSS_DRAGGING = 'dragging';

    protected readonly TEXT_OFFSET = 20;

    protected _center$: BehaviorSubject<Point>;

    private _dragging$: BehaviorSubject<boolean>;
    private _lastPoint: Point | undefined;
    private _isFixed = false;
    private _isFixedOld = false;
    protected _mainElement: SVGElement | undefined;
    protected _elements: Array<SVGElement> = [];
    private _preDragPosition: Point;

    private _layerNodes: Array<SvgWrapper> | undefined;
    private _layerIndex: number | undefined;

    private _subs: Array<Subscription>;

    protected constructor(id?: string) {
        super(id);
        this._center$ = new BehaviorSubject<Point>({x: 0, y: 0});
        this._dragging$ = new BehaviorSubject<boolean>(false);
        this._preDragPosition = {x: 0, y: 0};
        this._subs = [
            this._center$.subscribe(_ => this.updateMainElementPos())
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

    get dragging(): boolean {
        return this._dragging$.value;
    }

    get isFixed(): boolean {
        return this._isFixed;
    }

    set isFixed(value: boolean) {
        this._isFixed = value;
        this._isFixedOld = value;
    }

    public isDragging$(): Observable<boolean> {
        return this._dragging$.asObservable();
    }

    public cloneCenter(): Point {
        return {
            x: this.x,
            y: this.y
        }
    }

    public destroy() {
        this._dragging$.complete();
        this._subs.forEach(s => s.unsubscribe());
    }

    public getElements(): Array<SVGElement> {
        return [...this._elements];
    }

    bindEvents(mouseMoved$: Subject<MouseEvent>, mouseUp$: Subject<MouseEvent>, mouseMovedReactionFactory: (svg: SvgWrapper) => (e: MouseEvent) => void): void {
        const processMouseMoved = mouseMovedReactionFactory(this);
        this._subs.push(
            mouseMoved$.asObservable().subscribe(e => processMouseMoved(e)),
            mouseUp$.asObservable().subscribe(() => this.processMouseUp())
        );
    }

    public processMouseDown(event: MouseEvent) {
        if (this._mainElement === undefined) {
            return;
        }
        event.stopPropagation();
        this._dragging$.next(true);
        this._isFixedOld = this._isFixed;
        this._isFixed = true;
        this._preDragPosition = this.center;
        this._lastPoint = {x: event.x, y: event.y};
        this.swapMainElementCssClass(SvgWrapper.CSS_DRAGGABLE, SvgWrapper.CSS_DRAGGING);
    }

    public processMouseUp() {
        if (this._mainElement === undefined || !this.dragging) {
            return;
        }

        this._dragging$.next(false);
        this._isFixed = this._isFixedOld;
        this._lastPoint = undefined;
        this.center = {x: this._preDragPosition.x, y: this._preDragPosition.y}
        this.swapMainElementCssClass(SvgWrapper.CSS_DRAGGING, SvgWrapper.CSS_DRAGGABLE);
    }

    public processMouseMovedLayered(event: MouseEvent) {
        if (!this.dragging || this._mainElement === undefined || this._lastPoint === undefined) {
            return;
        }

        const y = this.newCoordinates(event).y;
        this.updateLastPoint(event);
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

    public processMouseMovedFree(event: MouseEvent) {
        if (!this.dragging || this._mainElement === undefined || this._lastPoint === undefined) {
            return;
        }

        const coords = this.newCoordinates(event);
        this.updateLastPoint(event);
        this.center = coords;
        this._preDragPosition = coords;
    }

    protected newCoordinates(event: MouseEvent): Point {
        return {
            x: this.x + event.x - this._lastPoint!.x,
            y: this.y + event.y - this._lastPoint!.y,
        };
    }

    protected updateLastPoint(event: MouseEvent) {
        this._lastPoint!.x = event.x;
        this._lastPoint!.y = event.y;
    }

    public registerMainElement(element: SVGElement) {
        this._mainElement = element;
        this._mainElement.onmousedown = (event) => {
            this.processMouseDown(event);
        };
        this._elements.push(element);
        this.updateMainElementPos();
    }

    public registerLayer(layer: Array<SvgWrapper>, index: number) {
        this._layerNodes = layer;
        this._layerIndex = index;
    }

    private updateMainElementPos() {
        if (this._mainElement === undefined) {
            return;
        }
        const offset = this.svgOffset();
        this._mainElement.setAttribute(this.svgX(), `${this.x + offset.x}`)
        this._mainElement.setAttribute(this.svgY(), `${this.y + offset.y}`)
    }

    protected svgOffset(): Point {
        return {x: 0, y: 0};
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

    private swapMainElementCssClass(remove: string, add: string) {
        if (this._mainElement === undefined) {
            return;
        }

        this._mainElement.classList.remove(remove);
        this._mainElement.classList.add(add);
    }
}
