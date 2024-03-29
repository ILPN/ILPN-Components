import {
    AfterViewInit,
    Component,
    ElementRef, EventEmitter,
    Input,
    OnDestroy, Output,
    ViewChild,
    ViewEncapsulation
} from '@angular/core';
import {PetriNet} from '../../models/pn/model/petri-net';
import {BehaviorSubject, distinctUntilChanged, Observable, Subject, Subscription} from 'rxjs';
import {addPoints, computeDeltas, Point} from '../../utility/svg/point';
import {OriginAndZoom} from './internals/model/origin-and-zoom';
import {inverseZoomFactor, zoomFactor} from './internals/zoom-factor';
import {SvgPetriNet} from './svg-net/svg-petri-net';
import {Marking} from '../../models/pn/model/marking';
import {PetriNetLayoutManager, PetriNetLayoutManagerFactoryService} from "./services/petri-net-layout.manager";
import {BoundingBox} from "../../utility/svg/bounding-box";


@Component({
    selector: 'ilpn-pn-display',
    templateUrl: './pn-display.component.html',
    styleUrls: ['./pn-display.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class PnDisplayComponent implements AfterViewInit, OnDestroy {

    private static readonly TIMEOUT = 100;

    @ViewChild('drawingArea') drawingArea: ElementRef<SVGElement> | undefined;
    @Input() petriNet$: Observable<PetriNet> | undefined;
    @Input() placeFill$: Observable<Map<string, string> | undefined> | undefined;
    @Input() marking$: Observable<Marking> | undefined;
    @Output() placeClicked: EventEmitter<string>;

    readonly originAndZoom$: BehaviorSubject<OriginAndZoom>;

    _width: number | string = '100%';
    _height: number | string = '100%';

    public panning = false;
    public zoomingIn$: BehaviorSubject<boolean>;
    public zoomingOut$: BehaviorSubject<boolean>;

    private _subs: Array<Subscription>;
    private _lastPoint: Point | undefined;
    private readonly _mouseMoved$: Subject<MouseEvent>;
    private readonly _mouseUp$: Subject<MouseEvent>;
    private _net: PetriNet | undefined;
    private _svgNet: SvgPetriNet | undefined;
    private _placeClickSub: Subscription | undefined;
    private _netLayoutSub: Subscription | undefined;
    private _layoutManager: PetriNetLayoutManager;
    private _timeout?: number;

    constructor(layoutManagerFactory: PetriNetLayoutManagerFactoryService) {
        this._layoutManager = layoutManagerFactory.create();
        this._mouseMoved$ = new Subject<MouseEvent>();
        this._mouseUp$ = new Subject<MouseEvent>();
        this.zoomingIn$ = new BehaviorSubject<boolean>(false);
        this.zoomingOut$ = new BehaviorSubject<boolean>(false);
        this._subs = [];
        this.originAndZoom$ = new BehaviorSubject<OriginAndZoom>(new OriginAndZoom(0, 0, 0));
        this.placeClicked = new EventEmitter<string>();

        this._subs.push(
            this._mouseUp$.subscribe(e => this.processMouseUp(e)),
            this._mouseMoved$.subscribe(e => this.processMouseMove(e))
        );
    }

    ngAfterViewInit(): void {
        if (this.drawingArea === undefined || this.petriNet$ === undefined) {
            return;
        }

        const canvasDimensions = this.drawingArea.nativeElement.getBoundingClientRect() as DOMRect;
        this.originAndZoom$.next(this.originAndZoom$.value.update({
            width: canvasDimensions.width,
            height: canvasDimensions.height
        }));

        this._subs.push(
            this.petriNet$.pipe(
                distinctUntilChanged()
            ).subscribe(net => {
                if (this._svgNet !== undefined) {
                    this._svgNet.destroy();
                    if (this._placeClickSub !== undefined) {
                        this._placeClickSub.unsubscribe();
                        this._placeClickSub = undefined;
                    }
                }
                this._net = net;
                this.clearDrawingArea();

                if (this._net.isEmpty()) {
                    if (this._netLayoutSub !== undefined) {
                        this._netLayoutSub.unsubscribe();
                        this._netLayoutSub = undefined;
                    }
                    this._svgNet = undefined;
                    return;
                }

                this._svgNet = new SvgPetriNet(this._net, this.originAndZoom$);
                this._svgNet.bindEvents(this._mouseMoved$, this._mouseUp$, (svg) => this._layoutManager.getMouseMovedReaction(svg));
                this._placeClickSub = this._svgNet.getPlaceClicked$().subscribe(pid => {
                    this.placeClicked.next(pid);
                });

                if (this._netLayoutSub !== undefined) {
                    this._netLayoutSub.unsubscribe();
                }
                this._netLayoutSub = this._layoutManager.overlayLayout(this._svgNet).subscribe(bb => {
                    if (!this._svgNet!.dragging) {
                        this.centerNet(bb);
                    }
                });

                this._svgNet.showArcWeights();

                const elements: Array<SVGElement> = this._svgNet.getSvgElements();
                if (this.drawingArea !== undefined) {
                    for (const element of elements) {
                        this.drawingArea.nativeElement.appendChild(element);
                    }
                }
            })
        )

        if (this.placeFill$ !== undefined) {
            this._subs.push(
                this.placeFill$.subscribe(fills => {
                    if (this._svgNet === undefined || this._net === undefined) {
                        return;
                    }
                    if (fills === undefined) {
                        fills = new Map<string, string>();
                    }
                    for (const p of this._net.getPlaces()) {
                        const svg = this._svgNet.getMappedPlace(p);
                        svg!.fill(fills.get(p.getId()));
                    }
                })
            );
        }

        if (this.marking$ !== undefined) {
            this._subs.push(
                this.marking$.subscribe(marking => {
                    if (this._svgNet === undefined) {
                        return;
                    }
                    this._svgNet.showMarking(marking);
                })
            );
        }
    }

    ngOnDestroy(): void {
        this.stopTimeout();
        this._subs.forEach(s => s.unsubscribe());
        if (this._netLayoutSub !== undefined) {
            this._netLayoutSub.unsubscribe();
        }
        this.originAndZoom$.complete();
        this._mouseMoved$.complete();
        this._mouseUp$.complete();
        this._svgNet?.destroy();
    }

    @Input()
    public set width(width: number | string) {
        this._width = width;
        this.delayedResize();
    }

    @Input()
    public set height(height: number | string) {
        this._height = height;
        this.delayedResize();
    }

    processMouseDown(event: MouseEvent) {
        this.panning = true;
        this._lastPoint = {x: event.x, y: event.y};
    }

    shareMouseUp(event: MouseEvent) {
        this._mouseUp$.next(event);
    }

    shareMouseMoved(event: MouseEvent) {
        this._mouseMoved$.next(event);
    }

    shareMouseExited(event: MouseEvent) {
        this._mouseUp$.next(event);
    }

    processMouseScroll(event: WheelEvent) {
        if (event.deltaY < 0) {
            this.zoomingIn$.next(true);
            this.zoomingOut$.next(false);
            this.setTimeout(() => {
                this.zoomingIn$.next(false);
            })
        } else {
            this.zoomingIn$.next(false);
            this.zoomingOut$.next(true);
            this.setTimeout(() => {
                this.zoomingOut$.next(false);
            })
        }

        const oaz = this.originAndZoom$.value;

        const oldF = zoomFactor(oaz.zoom);
        const newF = zoomFactor(oaz.zoom + event.deltaY);

        let svgElement = event.target as Element;
        while (svgElement.tagName !== 'svg') {
            svgElement = svgElement.parentElement!;
        }

        const mouseSvgX = event.clientX - (svgElement as SVGElement).getBoundingClientRect().x;
        const mouseSvgY = event.clientY - (svgElement as SVGElement).getBoundingClientRect().y;
        this.originAndZoom$.next(oaz.update({
            x: this.computeZoomOffset(oldF, newF, oaz.x, mouseSvgX),
            y: this.computeZoomOffset(oldF, newF, oaz.y, mouseSvgY),
            zoom: oaz.zoom + event.deltaY
        }));
        event.preventDefault();
    }

    private computeZoomOffset(oldF: number, newF: number, offset: number, z: number): number {
        return offset + z * (oldF - newF);
    }

    private processMouseUp(event: MouseEvent) {
        this.panning = false;
        this._lastPoint = undefined;
    }

    private processMouseMove(event: MouseEvent) {
        if (!this.panning) {
            return;
        }
        const oaz = this.originAndZoom$.value;
        const factor = zoomFactor(oaz.zoom);
        this.originAndZoom$.next(oaz.update({
            x: oaz.x - (event.x - this._lastPoint!.x) * factor,
            y: oaz.y - (event.y - this._lastPoint!.y) * factor
        }));
        this._lastPoint!.x = event.x;
        this._lastPoint!.y = event.y;
    }

    private clearDrawingArea() {
        const drawingArea = this.drawingArea?.nativeElement;
        if (drawingArea?.childElementCount === undefined) {
            return;
        }

        while (drawingArea.childElementCount > 1) {
            drawingArea.removeChild(drawingArea.lastChild as ChildNode);
        }
    }

    private delayedResize() {
        setTimeout(() => {
            const canvasDimensions = this.drawingArea?.nativeElement?.getBoundingClientRect() as DOMRect;
            if (canvasDimensions === undefined) {
                return;
            }
            this.resize(canvasDimensions.width, canvasDimensions.height);
        });
    }

    private resize(newWidth: number, newHeight: number) {
        this.originAndZoom$.next(this.originAndZoom$.value.update({width: newWidth, height: newHeight}));
    }

    private centerNet(boundingBox: BoundingBox) {
        const canvasDimensions = this.drawingArea?.nativeElement.getBoundingClientRect() as DOMRect;
        const widthHeight = computeDeltas(boundingBox.tl, boundingBox.br);

        const netWidth = widthHeight.x + 100;
        const netHeight = widthHeight.y + 100;
        let canvasWidth = canvasDimensions.width;
        let canvasHeight = canvasDimensions.height;
        const netTopLeft = boundingBox.tl;
        addPoints(netTopLeft, {x: -50, y: -50});


        let zoom = 0;
        if (netWidth > canvasWidth || netHeight > canvasHeight) {
            const factor = Math.max(netWidth / canvasWidth, netHeight / canvasHeight);
            zoom = inverseZoomFactor(factor);

            canvasWidth *= factor;
            canvasHeight *= factor;
        }

        this.originAndZoom$.next(this.originAndZoom$.value.update({
            x: netTopLeft.x - ((canvasWidth - netWidth) / 2),
            y: netTopLeft.y - ((canvasHeight - netHeight) / 2),
            zoom
        }));
    }

    private setTimeout(callback: () => void) {
        this.stopTimeout();
        this._timeout = setTimeout(callback, PnDisplayComponent.TIMEOUT);
    }

    private stopTimeout() {
        if (this._timeout !== undefined) {
            clearTimeout(this._timeout);
            this._timeout = undefined;
        }
    }
}
