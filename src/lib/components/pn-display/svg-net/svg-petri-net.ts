import {PetriNet} from '../../../models/pn/model/petri-net';
import {SvgPlace} from './svg-place';
import {SvgTransition} from './svg-transition';
import {SvgArc} from './svg-arc';
import {Place} from '../../../models/pn/model/place';
import {Transition} from '../../../models/pn/model/transition';
import {Arc} from '../../../models/pn/model/arc';
import {Node} from '../../../models/pn/model/node';
import {SvgWrapper} from './svg-wrapper';
import {BehaviorSubject, combineLatest, merge, Observable, Subject, Subscription} from 'rxjs';
import {Marking} from '../../../models/pn/model/marking';
import {ZoomWrapper} from "../internals/model/zoom-wrapper";


export class SvgPetriNet {

    private readonly _net: PetriNet;
    private readonly _places: Map<string, SvgPlace>;
    private readonly _transition: Map<string, SvgTransition>;
    private readonly _arcs: Map<string, SvgArc>;
    private readonly _dragging$: BehaviorSubject<boolean>;
    private readonly _sub: Subscription;

    constructor(net: PetriNet, private _zoomWrapper?: ZoomWrapper) {
        this._dragging$ = new BehaviorSubject<boolean>(false);
        const observables: Array<Observable<boolean>> = [];

        this._net = net;
        this._places = new Map<string, SvgPlace>();
        for (const p of net.getPlaces()) {
            const svgPlace = new SvgPlace(p, this._zoomWrapper);
            this._places.set(p.getId(), svgPlace);
            observables.push(svgPlace.isDragging$());
        }
        this._transition = new Map<string, SvgTransition>();
        for (const t of net.getTransitions()) {
            const svgTransition = new SvgTransition(t, this._zoomWrapper);
            this._transition.set(t.getId(), svgTransition);
            observables.push(svgTransition.isDragging$());
        }
        this._arcs = new Map<string, SvgArc>();
        for (const a of net.getArcs()) {
            let s, d;
            let svgArc;
            if (a.source instanceof Place) {
                s = this._places.get(a.sourceId)!;
                d = this._transition.get(a.destinationId)!;
                svgArc =  new SvgArc(s, d, a, this._zoomWrapper);
                this._arcs.set(a.getId(), svgArc);
            } else {
                s = this._transition.get(a.sourceId!)!;
                d = this._places.get(a.destinationId)!;
                svgArc = new SvgArc(s, d, a, this._zoomWrapper);
                this._arcs.set(a.getId(), svgArc);
            }
            observables.push(svgArc.isDragging$());
        }

        this._sub = combineLatest(observables).subscribe(dragging => {
            this._dragging$.next(dragging.some(b => b));
        });
    }

    public destroy() {
        this._sub.unsubscribe();
        this._dragging$.complete();

        for (const p of this._places.values()) {
            p.destroy();
        }
        for (const t of this._transition.values()) {
            t.destroy();
        }
        for (const a of this._arcs.values()) {
            a.destroy();
        }
    }

    public get dragging(): boolean {
        return this._dragging$.value;
    }

    public bindEvents(mouseMoved$: Subject<MouseEvent>, mouseUp$: Subject<MouseEvent>, mouseMovedReactionFactory: (svg: SvgWrapper) => (e: MouseEvent) => void) {
        for (const p of this._places.values()) {
            p.bindEvents(mouseMoved$, mouseUp$, mouseMovedReactionFactory);
        }
        for (const t of this._transition.values()) {
            t.bindEvents(mouseMoved$, mouseUp$, mouseMovedReactionFactory);
        }
        for (const a of this._arcs.values()) {
            a.bindEvents(mouseMoved$, mouseUp$, mouseMovedReactionFactory);
        }
    }

    public showArcWeights() {
        for (const a of this._arcs.values()) {
            a.showWeight();
        }
    }

    public getSvgElements(): Array<SVGElement> {
        const result: Array<SVGElement> = [];

        for (const p of this._places.values()) {
            result.push(...p.getElements());
        }
        for (const t of this._transition.values()) {
            result.push(...t.getElements());
        }
        for (const a of this._arcs.values()) {
            result.push(...a.getElements());
        }

        return result;
    }

    public getNet(): PetriNet {
        return this._net;
    }

    public getMappedPlace(place: Place | Node): SvgPlace | undefined {
        return this._places.get(place.getId());
    }

    public getMappedTransition(transition: Transition | Node): SvgTransition | undefined  {
        return this._transition.get(transition.getId());
    }

    public getMappedWrapper(node: Place | Transition | Node): SvgPlace | SvgTransition | undefined {
        return this.getMappedPlace(node) ?? this.getMappedTransition(node);
    }

    public getMappedArc(arc: Arc): SvgArc {
        return this._arcs.get(arc.getId())!;
    }

    public getMappedArcs(): Array<SvgArc> {
        return Array.from(this._arcs.values());
    }

    public getInverseMappedPlace(svgPlace: SvgPlace | SvgWrapper): Place | undefined {
        return this._net.getPlace(svgPlace.getId());
    }

    public getInverseMappedTransition(svgTransition: SvgTransition | SvgWrapper): Transition | undefined {
        return this._net.getTransition(svgTransition.getId());
    }

    public getInverseMappedNode(wrapper: SvgPlace | SvgTransition | SvgWrapper): Place | Transition | undefined {
        return this.getInverseMappedPlace(wrapper) ?? this.getInverseMappedTransition(wrapper);
    }

    public getMappedNodes(): Array<SvgTransition | SvgPlace> {
        return [...this._transition.values(), ...this._places.values()];
    }

    public getPlaceClicked$(): Observable<string> {
        const places$ = [];
        for (const p of this._places.values()) {
            places$.push(p.clicked$);
        }
        return merge(...places$);
    }

    public showMarking(marking: Marking) {
        for (const p of this._places.values()) {
            p.updateMarking(marking.get(p.getId()) ?? 0);
        }
    }
}
