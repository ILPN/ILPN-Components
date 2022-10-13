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
import {PnRendererService} from './internals/services/pn-renderer.service';
import {Point} from '../../models/pn/model/point';
import {PnLayoutingService} from './internals/services/pn-layouting.service';
import {OriginAndZoom} from './internals/model/origin-and-zoom';


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

    private _subs: Array<Subscription>;
    private _dragging = false;
    private _lastPoint: Point | undefined;
    private readonly _mouseMoved$: Subject<MouseEvent>;
    private readonly _mouseUp$: Subject<MouseEvent>;
    private _net: PetriNet | undefined;
    private _redrawSub: Subscription | undefined;

    constructor(private _layoutingService: PnLayoutingService,
                private _renderingService: PnRendererService) {
        this._mouseMoved$ = new Subject<MouseEvent>();
        this._mouseUp$ = new Subject<MouseEvent>();
        this._subs = [];
        this.originAndZoom = new OriginAndZoom(0, 0, 1);

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
            if (this._net !== undefined) {
                this._net.destroy();
            }
            if (this._redrawSub !== undefined) {
                this._redrawSub.unsubscribe();
            }
            this._net = net;
            this._redrawSub = this._net.redrawRequest$().subscribe(() => this.draw());
            const dimensions = this._layoutingService.layout(this._net);
            this._net.bindEvents(this._mouseMoved$, this._mouseUp$);
            const canvasDimensions = this.drawingArea?.nativeElement.getBoundingClientRect() as DOMRect;
            this.originAndZoom = this.originAndZoom.update({
                x: -((canvasDimensions.width - dimensions.x) / 2),
                y: -((canvasDimensions.height - dimensions.y) / 2)
            });
            this.draw();
        }))
    }

    ngOnDestroy(): void {
        this._subs.forEach(s => s.unsubscribe());
        this._mouseMoved$.complete();
        this._mouseUp$.complete();
        this._net?.destroy();
        this._redrawSub?.unsubscribe();
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

    private processMouseUp(event: MouseEvent) {
        this._dragging = false;
        this._lastPoint = undefined;
    }

    private processMouseMove(event: MouseEvent) {
        if (this._dragging) {
            this.originAndZoom = this.originAndZoom.update({
                x: this.originAndZoom.x - (event.x - this._lastPoint!.x),
                y: this.originAndZoom.y - (event.y - this._lastPoint!.y)
            });
            this._lastPoint!.x = event.x;
            this._lastPoint!.y = event.y;
        }
    }

    private draw() {
        if (this.drawingArea === undefined) {
            console.debug('drawing area not ready yet')
            return;
        }

        this.clearDrawingArea();
        const elements = this._renderingService.createNetElements(this._net!);
        for (const element of elements) {
            this.drawingArea.nativeElement.appendChild(element);
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

}
