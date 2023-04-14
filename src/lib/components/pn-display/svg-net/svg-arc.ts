import {SvgWrapper} from './svg-wrapper';
import {DragPoint} from './drag-point';
import {computeDeltas, Point} from '../../../utility/svg/point';
import {PLACE_STYLE} from '../internals/constants/place-style';
import {SvgPlace} from './svg-place';
import {SvgTransition} from './svg-transition';
import {Arc} from '../../../models/pn/model/arc';
import {ARC_END_STYLE, ARC_STYLE} from '../internals/constants/arc-style';
import {Subject, Subscription} from 'rxjs';
import {TransitionStyle} from '../internals/constants/transition-style';


interface NewLine {
    line: SVGElement,
    subs: Array<Subscription>
}

export class SvgArc extends SvgWrapper {

    private readonly ARC_WEIGHT_OFFSET_VERTICAL = 15;
    private readonly ARC_WEIGHT_OFFSET_HORIZONTAL = 10;

    private readonly _arc: Arc;

    public readonly source: SvgPlace | SvgTransition;
    public readonly destination: SvgTransition | SvgPlace;
    private readonly _breakpoints: Array<DragPoint>;
    private readonly _lines: Array<SVGElement>;
    private readonly _subPoints: Array<Array<Subscription>>;
    private readonly _subWeight: Array<Subscription>;

    private _mouseMoved$?: Subject<MouseEvent>;
    private _mouseUp$?: Subject<MouseEvent>;

    constructor(source: SvgPlace, destination: SvgTransition, arc: Arc);
    constructor(source: SvgTransition, destination: SvgPlace, arc: Arc);
    constructor(source: SvgPlace | SvgTransition, destination: SvgTransition | SvgPlace, arc: Arc) {
        super();
        this._arc = arc;
        this._breakpoints = [];

        this.source = source;
        this.destination = destination;

        const newLine = this.addLine(source, destination);
        this.applyStyle(newLine.line, ARC_END_STYLE);
        this._lines = [newLine.line];
        this._subPoints = [newLine.subs];

        this._subWeight = [];
    }

    get hasBreakpoints(): boolean {
        return this._breakpoints.length > 0;
    }

    override destroy() {
        super.destroy();
        this._subPoints.forEach(pair => {
            pair[0].unsubscribe();
            pair[1].unsubscribe();
        })
        this._subWeight.forEach(s => s.unsubscribe());
    }

    override bindEvents(mouseMoved$: Subject<MouseEvent>, mouseUp$: Subject<MouseEvent>) {
        super.bindEvents(mouseMoved$, mouseUp$);
        this._mouseMoved$ = mouseMoved$;
        this._mouseUp$ = mouseUp$;
    }

    override getElements(): Array<SVGElement> {
        return [...super.getElements(), ...this._breakpoints.flatMap(b => b.getElements())];
    }

    public addBreakpoint(point: DragPoint) {
        // new line segment
        const source = this._breakpoints.length > 0 ? this._breakpoints[this._breakpoints.length - 1] : this.source;
        const newSegment = this.addLine(source, point);
        this._lines.splice(this._lines.length - 1, 0, newSegment.line);
        const oldSubs = this._subPoints.pop()!;
        oldSubs[0].unsubscribe();
        oldSubs[1].unsubscribe();
        this._subPoints.push(newSegment.subs);

        const updatedSegment = this.addLine(point, this.destination, this._lines[this._lines.length - 1]);
        this._subPoints.push(updatedSegment.subs);

        point.bindEvents(this._mouseMoved$!, this._mouseUp$!);

        this._breakpoints.push(point);
    }

    private addLine(src: SvgWrapper, dest: SvgWrapper, line?: SVGElement): NewLine {
        if (line === undefined) {
            line = this.createSvgLine();
        }

        const subs = [
            src.center$.subscribe(c => {
                this.setLineCoordinates(line!,
                    this.computeLinePoint(c, src, dest.center),
                    this.computeLinePoint(dest.center, dest, c)
                );
            }),
            dest.center$.subscribe(c => {
                this.setLineCoordinates(line!,
                    this.computeLinePoint(src.center, src, c),
                    this.computeLinePoint(c, dest, src.center),
                );
            })
        ];

        return {line, subs};
    }

    private computePlacePoint(placeCenter: Point, destinationCenter: Point): Point {
        const delta = computeDeltas(placeCenter, destinationCenter);
        let lineAngle = Math.atan(Math.abs(delta.y / delta.x));
        if (delta.x < 0) {
            lineAngle = Math.PI - lineAngle;
        }
        if (-delta.y < 0) {
            lineAngle = -lineAngle;
        }
        return {
            x: placeCenter.x + Math.cos(lineAngle) * parseInt(PLACE_STYLE.r),
            y: placeCenter.y - Math.sin(lineAngle) * parseInt(PLACE_STYLE.r)
        };
    }

    private computeTransitionPoint(transitionCenter: Point, destinationCenter: Point, style: TransitionStyle): Point {
        const delta = computeDeltas(transitionCenter, destinationCenter);
        const deltaQ = Math.abs(delta.y / delta.x);
        const xSign = Math.sign(delta.x);
        const ySign = Math.sign(delta.y);
        const halfWidth = parseInt(style.width) / 2;
        const halfHeight = parseInt(style.height) / 2;
        const quadrantThreshold = this.computeRectDiagonalThreshold(style);
        if (deltaQ < quadrantThreshold) {
            return {
                x: transitionCenter.x + xSign * halfWidth,
                y: transitionCenter.y + ySign * deltaQ * halfWidth
            };
        } else {
            return {
                x: transitionCenter.x + xSign * (1 / deltaQ) * halfHeight,
                y: transitionCenter.y + ySign * halfHeight
            };
        }
    }

    private computeRectDiagonalThreshold(style: TransitionStyle): number {
        const height = parseInt(style.height);
        const width = parseInt(style.width);
        return height / width;
    }

    private computeLinePoint(d: Point, dest: SvgWrapper, s: Point): Point {
        if (d.x === s.x && d.y === s.y) {
            return d;
        }
        if (dest instanceof SvgPlace) {
            return this.computePlacePoint(d, s);
        } else if (dest instanceof SvgTransition) {
            return this.computeTransitionPoint(d, s, dest.resolveTransitionStyle());
        } else {
            return d;
        }
    }

    private createSvgLine(): SVGElement {
        const result = this.createSvgElement('line');
        this.applyStyle(result, ARC_STYLE);
        this._elements.push(result);
        return result;
    }

    private setLineCoordinates(line: SVGElement, src: Point, dest: Point) {
        line.setAttribute('x1', '' + src.x);
        line.setAttribute('y1', '' + src.y);
        line.setAttribute('x2', '' + dest.x);
        line.setAttribute('y2', '' + dest.y);
    }

    public showWeight() {
        if (this._arc.weight === 1) {
            return;
        }

        const weightEl = this.createTextElement('' + this._arc.weight);
        this._elements.push(weightEl);

        if (this._breakpoints.length % 2 === 1) {
            const center = this._breakpoints[this._breakpoints.length / 2];

            this._subWeight.push(
                center.center$.subscribe(c => {
                    weightEl.setAttribute('x', `${c.x + this.ARC_WEIGHT_OFFSET_HORIZONTAL}`);
                    weightEl.setAttribute('y', `${c.y + this.ARC_WEIGHT_OFFSET_VERTICAL}`);
                })
            );
        } else {
            let start: SvgWrapper;
            let end: SvgWrapper;
            if (this.hasBreakpoints) {
                const half = this._breakpoints.length / 2;
                start = this._breakpoints[half - 1];
                end = this._breakpoints[half];
            } else {
                start = this.source;
                end = this.destination;
            }

            this._subWeight.push(
                start.center$.subscribe(c => this.changeWeightPos(c, end.center, weightEl)),
                end.center$.subscribe(c => this.changeWeightPos(start.center, c, weightEl))
            );
        }
    }

    private changeWeightPos(source: Point, destination: Point, weightEl: SVGElement) {
        const delta = computeDeltas(source, destination);
        const corner = {x: Math.min(source.x, destination.x), y: Math.min(source.y, destination.y)}
        const center = {x: corner.x + Math.abs(delta.x / 2), y: corner.y + Math.abs(delta.y / 2)}
        const xSign = Math.sign(delta.x);
        const ySign = Math.sign(delta.y);

        const x = center.x + this.ARC_WEIGHT_OFFSET_HORIZONTAL;
        let y;
        if (xSign === ySign || xSign === 0 || ySign === 0) {
            y = center.y - this.ARC_WEIGHT_OFFSET_VERTICAL;
        } else {
            y = center.y + this.ARC_WEIGHT_OFFSET_VERTICAL;
        }

        weightEl.setAttribute('x', `${x}`);
        weightEl.setAttribute('y', `${y}`);
    }
}
