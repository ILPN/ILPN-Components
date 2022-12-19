import {Injectable} from '@angular/core';
import {Node} from '../../../../models/pn/model/node';
import {PetriNet} from '../../../../models/pn/model/petri-net';
import {Point} from '../../../../models/pn/model/point';
import {Transition} from '../../../../models/pn/model/transition';
import {Place} from '../../../../models/pn/model/place';
import {Arc} from '../../../../models/pn/model/arc';
import {DragPoint} from '../../../../models/pn/model/drag-point';
import {PLACE_STYLE} from '../constants/place-style';
import {ARC_END_STYLE, ARC_STYLE} from '../constants/arc-style';
import {TEXT_STYLE} from '../constants/text-style';
import {SILENT_TRANSITION_STYLE, TRANSITION_STYLE, TransitionStyle} from '../constants/transition-style';
import {DRAG_POINT_STYLE} from '../constants/drag-point-style';


@Injectable({
    providedIn: 'root'
})
export class PnRendererService {

    private readonly TEXT_OFFSET = 20;
    private readonly ARC_WEIGHT_OFFSET_VERTICAL = 15;
    private readonly ARC_WEIGHT_OFFSET_HORIZONTAL = 10;

    public createNetElements(net: PetriNet): Array<SVGElement> {
        const result: Array<SVGElement> = [];
        for (const transition of net.getTransitions()) {
            result.push(...this.createTransitionElement(transition));
        }
        for (const place of net.getPlaces()) {
            result.push(...this.createPlaceElement(place));
        }
        for (const arc of net.getArcs()) {
            result.push(...this.createArc(arc));
        }
        return result;
    }

    private createTransitionElement(transition: Transition): Array<SVGElement> {
        const transEl = this.createSvgElement('rect');
        const style = this.resolveTransitionStyle(transition);
        transEl.setAttribute('x', '' + (transition.x - parseInt(style.width) / 2));
        transEl.setAttribute('y', '' + (transition.y - parseInt(style.height) / 2));
        this.applyStyle(transEl, style);
        transition.registerElement(transEl);
        if (transition.isSilent) {
            return [transEl];
        }
        const textEl = this.createTextElement(transition.label as string);
        textEl.setAttribute('x', '' + transition.x)
        textEl.setAttribute('y', '' + (transition.y + parseInt(style.height) / 2 + this.TEXT_OFFSET));
        return [transEl, textEl];
    }

    private createPlaceElement(place: Place): Array<SVGElement> {
        const placeEl = this.createSvgElement('circle');
        placeEl.setAttribute('cx', '' + place.x);
        placeEl.setAttribute('cy', '' + place.y);
        this.applyStyle(placeEl, PLACE_STYLE);
        place.registerElement(placeEl);
        const textEl = this.createTextElement(place.id!);
        textEl.setAttribute('x', '' + place.x)
        textEl.setAttribute('y', '' + (place.y + parseInt(PLACE_STYLE.r) + this.TEXT_OFFSET));
        const result = [placeEl, textEl];
        if (place.marking > 0) {
            const markingEl = this.createTextElement('' + place.marking);
            markingEl.setAttribute('x', '' + place.x)
            markingEl.setAttribute('y', '' + place.y);
            markingEl.setAttribute('font-size', '1.5em');
            result.push(markingEl);
        }
        return result;
    }

    private createArc(arc: Arc): Array<SVGElement> {
        let source: Node | undefined = arc.source;
        let destination;
        let sourcePoint;
        let destinationPoint;
        if (source instanceof Place) {
            destination = arc.destination as Transition;
            if (arc.hasBreakpoints) {
                sourcePoint = this.computePlacePoint(source, arc.firstBreakpoint);
                destinationPoint = this.computeTransitionPoint(destination, arc.lastBreakpoint);
            } else {
                sourcePoint = this.computePlacePoint(source, destination.center);
                destinationPoint = this.computeTransitionPoint(destination, source.center);
            }
        } else if (source instanceof Transition) {
            destination = arc.destination as Place;
            if (arc.hasBreakpoints) {
                sourcePoint = this.computeTransitionPoint(source, arc.firstBreakpoint);
                destinationPoint = this.computePlacePoint(destination, arc.lastBreakpoint);
            } else {
                sourcePoint = this.computeTransitionPoint(source, destination.center);
                destinationPoint = this.computePlacePoint(destination, source.center);
            }
        } else {
            throw new Error('Unexpected arc source type! Arc source is neither Place nor Transition.');
        }
        const result = this.createSvgLines(arc, sourcePoint, destinationPoint);
        if (arc.weight > 1) {
            const location = this.computeWeightPoint(sourcePoint, destinationPoint, arc);
            const weightEl = this.createTextElement('' + arc.weight);
            weightEl.setAttribute('x', '' + location.x);
            weightEl.setAttribute('y', '' + location.y);
            result.push(weightEl);
        }
        return result;
    }

    private createSvgLines(arc: Arc, src: Point, dest: Point): Array<SVGElement> {
        const result = [];
        const points = [src, ...arc.breakpoints, dest];
        for (let i = 0; i < points.length - 1; i++) {
            result.push(this.createSvgLine(points[i], points[i + 1]));
        }
        this.applyStyle(result[result.length - 1], ARC_END_STYLE);
        for (let i = 0; i < arc.breakpoints.length; i++) {
            result.push(this.createSvgDragPoint(arc.breakpoints[i]));
        }
        return result
    }

    private createSvgLine(src: Point, dest: Point): SVGElement {
        const result = this.createSvgElement('line');
        this.applyStyle(result, ARC_STYLE);
        result.setAttribute('x1', '' + src.x);
        result.setAttribute('y1', '' + src.y);
        result.setAttribute('x2', '' + dest.x);
        result.setAttribute('y2', '' + dest.y);
        return result;
    }

    private createSvgDragPoint(dragPoint: DragPoint): SVGElement {
        const result = this.createSvgElement('circle');
        this.applyStyle(result, DRAG_POINT_STYLE);
        result.classList.add('drag-point');
        result.setAttribute('cx', '' + dragPoint.x);
        result.setAttribute('cy', '' + dragPoint.y);
        dragPoint.registerElement(result);
        return result;
    }

    private computePlacePoint(place: Place, destinationCenter: Point): Point {
        const placeCenter = place.center;
        const delta = this.computeDeltas(placeCenter, destinationCenter);
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

    private computeTransitionPoint(transition: Transition, destinationCenter: Point): Point {
        const transitionCenter = transition.center;
        const delta = this.computeDeltas(transitionCenter, destinationCenter);
        const deltaQ = Math.abs(delta.y / delta.x);
        const xSign = Math.sign(delta.x);
        const ySign = Math.sign(delta.y);
        const style = this.resolveTransitionStyle(transition);
        const halfWidth = parseInt(style.width) / 2;
        const halfHeight = parseInt(style.height) / 2;
        const quadrantThreshold = this.computeRectDiagonalThreshold(transition);
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

    private computeWeightPoint(source: Point, destination: Point, arc: Arc): Point {
        if (arc.hasBreakpoints) {
            if (arc.breakpoints.length % 2 === 1) {
                const center = arc.breakpoints[(arc.breakpoints.length - 1) / 2];
                return {
                    x: center.x + this.ARC_WEIGHT_OFFSET_HORIZONTAL,
                    y: center.y + this.ARC_WEIGHT_OFFSET_VERTICAL
                };
            } else {
                const centerIndex = arc.breakpoints.length / 2;
                source = arc.breakpoints[centerIndex - 1];
                destination = arc.breakpoints[centerIndex];
            }
        }

        const delta = this.computeDeltas(source, destination);
        const corner = {x: Math.min(source.x, destination.x), y: Math.min(source.y, destination.y)}
        const center = {x: corner.x + Math.abs(delta.x / 2), y: corner.y + Math.abs(delta.y / 2)}
        const xSign = Math.sign(delta.x);
        const ySign = Math.sign(delta.y);
        if (xSign === ySign || xSign === 0 || ySign === 0) {
            return {
                x: center.x + this.ARC_WEIGHT_OFFSET_HORIZONTAL,
                y: center.y - this.ARC_WEIGHT_OFFSET_VERTICAL,
            };
        } else {
            return {
                x: center.x + this.ARC_WEIGHT_OFFSET_HORIZONTAL,
                y: center.y + this.ARC_WEIGHT_OFFSET_VERTICAL,
            };
        }
    }

    private computeRectDiagonalThreshold(transition: Transition): number {
        const style = this.resolveTransitionStyle(transition);
        const height = parseInt(style.height);
        const width = parseInt(style.width);
        return height / width;
    }

    private computeDeltas(start: Point, end: Point): Point {
        return {
            x: end.x - start.x,
            y: end.y - start.y
        };
    }

    private applyStyle(element: SVGElement, style: object) {
        for (const entry of Object.entries(style)) {
            element.setAttribute(entry[0], entry[1]);
        }
    }

    private createTextElement(content: string): SVGElement {
        const result = this.createSvgElement('text');
        this.applyStyle(result, TEXT_STYLE);
        result.textContent = content;
        return result;
    }

    private createSvgElement(name: string): SVGElement {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }

    private resolveTransitionStyle(t: Transition): TransitionStyle {
        return t.isSilent ? SILENT_TRANSITION_STYLE : TRANSITION_STYLE;
    }
}
