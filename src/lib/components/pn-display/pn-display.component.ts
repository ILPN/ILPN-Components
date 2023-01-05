import {
    AfterViewInit,
    Component,
    ElementRef,
    Input,
    OnDestroy,
    ViewChild,
    ViewEncapsulation
} from '@angular/core';
import {PetriNet} from '../../models/pn/model/petri-net';
import {Observable, Subject, Subscription} from 'rxjs';
import {Point} from '../../utility/svg/point';
import {PnLayoutingService} from './internals/services/pn-layouting.service';
import {OriginAndZoom} from './internals/model/origin-and-zoom';
import {zoomFactor} from './internals/zoom-factor';
import {SvgPetriNet} from './internals/model/svg-net/svg-petri-net';


@Component({
    selector: 'ilpn-pn-display',
    templateUrl: './pn-display.component.html',
    styleUrls: ['./pn-display.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class PnDisplayComponent implements AfterViewInit, OnDestroy {

    @ViewChild('drawingArea') drawingArea: ElementRef<SVGElement> | undefined;
    @Input() petriNet$: Observable<PetriNet> | undefined;
    originAndZoom: OriginAndZoom;

    _width: number | string = '100%';
    _height: number | string = '100%';

    private _subs: Array<Subscription>;
    private _dragging = false;
    private _lastPoint: Point | undefined;
    private readonly _mouseMoved$: Subject<MouseEvent>;
    private readonly _mouseUp$: Subject<MouseEvent>;
    private _net: PetriNet | undefined;
    private _svgNet: SvgPetriNet | undefined;

    constructor(private _layoutingService: PnLayoutingService) {
        this._mouseMoved$ = new Subject<MouseEvent>();
        this._mouseUp$ = new Subject<MouseEvent>();
        this._subs = [];
        this.originAndZoom = new OriginAndZoom(0, 0, 0);

        this._subs.push(
            this._mouseUp$.subscribe(e => this.processMouseUp(e))
        );
        this._subs.push(
            this._mouseMoved$.subscribe(e => this.processMouseMove(e))
        );
    }

    ngAfterViewInit(): void {
        if (this.drawingArea === undefined || this.petriNet$ === undefined) {
            return;
        }

        const canvasDimensions = this.drawingArea.nativeElement.getBoundingClientRect() as DOMRect;
        this.originAndZoom = this.originAndZoom.update({
            width: canvasDimensions.width,
            height: canvasDimensions.height
        });

        this._subs.push(this.petriNet$.subscribe(net => {
            if (this._svgNet !== undefined) {
                this._svgNet.destroy();
            }
            this._net = net;
            this.clearDrawingArea();

            if (this._net.isEmpty()) {
                this._svgNet = undefined;
                return;
            }

            this._svgNet = new SvgPetriNet(this._net, this._mouseMoved$, this._mouseUp$);

            const dimensions = this._layoutingService.layout(this._svgNet);
            const canvasDimensions = this.drawingArea?.nativeElement.getBoundingClientRect() as DOMRect;
            this.originAndZoom = this.originAndZoom.update({
                x: -((canvasDimensions.width - dimensions.x) / 2),
                y: -((canvasDimensions.height - dimensions.y) / 2),
                zoom: 0
            });

            this._svgNet.showArcWeights();

            const elements: Array<SVGElement> = this._svgNet.getSvgElements();
            if (this.drawingArea !== undefined) {
                for (const element of elements) {
                    this.drawingArea.nativeElement.appendChild(element);
                }
            }
        }))
    }

    ngOnDestroy(): void {
        this._subs.forEach(s => s.unsubscribe());
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
        this._dragging = true;
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
        const oldF = zoomFactor(this.originAndZoom.zoom);
        const newF = zoomFactor(this.originAndZoom.zoom + event.deltaY);
        const mouseSvgX = event.pageX - (event.target as SVGElement).getBoundingClientRect().x;
        const mouseSvgY = event.pageY - (event.target as SVGElement).getBoundingClientRect().y;
        this.originAndZoom = this.originAndZoom.update({
            x: this.computeZoomOffset(oldF, newF, this.originAndZoom.x, mouseSvgX),
            y: this.computeZoomOffset(oldF, newF, this.originAndZoom.y, mouseSvgY),
            zoom: this.originAndZoom.zoom + event.deltaY
        });
        event.preventDefault();
    }

    private computeZoomOffset(oldF: number, newF: number, offset: number, z: number): number {
        return offset + z * (oldF - newF);
    }

    private processMouseUp(event: MouseEvent) {
        this._dragging = false;
        this._lastPoint = undefined;
    }

    private processMouseMove(event: MouseEvent) {
        if (this._dragging) {
            const factor = zoomFactor(this.originAndZoom.zoom);
            this.originAndZoom = this.originAndZoom.update({
                x: this.originAndZoom.x - (event.x - this._lastPoint!.x) * factor,
                y: this.originAndZoom.y - (event.y - this._lastPoint!.y) * factor
            });
            this._lastPoint!.x = event.x;
            this._lastPoint!.y = event.y;
        }
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
        this.originAndZoom = this.originAndZoom.update({width: newWidth, height: newHeight});
    }

}
