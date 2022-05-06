import {Place} from './place';
import {Transition} from './transition';
import {Arc} from './arc';
import {Observable, Subject} from 'rxjs';
import {IncrementingCounter} from '../../../utility/incrementing-counter';

export class PetriNet {
    private _places: Map<string, Place>;
    private _transitions: Map<string, Transition>;
    private _arcs: Map<string, Arc>;
    private _frequency: number | undefined;

    private _kill$: Subject<void>;

    private _redraw$: Subject<void>;

    constructor() {
        this._places = new Map<string, Place>();
        this._transitions = new Map<string, Transition>();
        this._arcs = new Map<string, Arc>();
        this._kill$ = new Subject<void>();
        this._redraw$ = new Subject<void>();
    }

    public static createFromArcSubset(net: PetriNet, arcs: Array<Arc>): PetriNet {
        const result = new PetriNet();
        net.getPlaces().forEach(p => {
            result.addPlace(new Place(p.id, p.x, p.y, p.marking));
        });
        net.getTransitions().forEach(t => {
            result.addTransition(new Transition(t.id, t.x, t.y, t.label));
        });
        arcs.forEach(a => {
            let source;
            let destination;
            if (a.source instanceof Place) {
                source = result.getPlace(a.sourceId) as Place;
                destination = result.getTransition(a.destinationId) as Transition;
            } else {
                source = result.getTransition(a.sourceId) as Transition;
                destination = result.getPlace(a.destinationId) as Place;
            }
            result.addArc(new Arc(a.id, source, destination, a.weight));
        });
        return result;
    }

    public static netUnion(a: PetriNet, b: PetriNet): PetriNet {
        const result = a.clone();

        const counter = new IncrementingCounter();
        const placeMap = new Map<string, string>();
        const transitionMap = new Map<string, string>();

        b.getPlaces().forEach(p => {
            let mappedId = p.id;
            while (result.getPlace(mappedId) !== undefined) {
                mappedId = p.id + counter.next();
            }
            placeMap.set(p.id, mappedId);
            result.addPlace(new Place(mappedId, p.x, p.y, p.marking));
        });

        b.getTransitions().forEach(t => {
            let mappedId = t.id;
            while (result.getTransition(mappedId) !== undefined) {
                mappedId = t.id + counter.next();
            }
            transitionMap.set(t.id, mappedId);
            result.addTransition(new Transition(mappedId, t.x, t.y, t.label));
        });

        b.getArcs().forEach(arc => {
            let arcId = arc.id;
            while (result.getArc(arcId) !== undefined) {
                arcId = arc.id + counter.next();
            }
            if (arc.source instanceof Place) {
                result.addArc(new Arc(arcId, result.getPlace(placeMap.get(arc.sourceId) as string) as Place, result.getTransition(transitionMap.get(arc.destinationId) as string) as Transition, arc.weight));
            } else {
                result.addArc(new Arc(arcId, result.getTransition(transitionMap.get(arc.sourceId) as string) as Transition, result.getPlace(placeMap.get(arc.destinationId) as string) as Place, arc.weight));
            }
        });

        return result;
    }

    public getTransition(id: string): Transition | undefined {
        return this._transitions.get(id);
    }

    public getTransitions(): Array<Transition> {
        return Array.from(this._transitions.values());
    }

    public addTransition(transition: Transition) {
        this._transitions.set(transition.id, transition);
    }

    public getPlace(id: string): Place | undefined {
        return this._places.get(id);
    }

    public getPlaces(): Array<Place> {
        return Array.from(this._places.values());
    }

    public addPlace(place: Place) {
        this._places.set(place.id, place);
    }

    public getArc(id: string): Arc | undefined {
        return this._arcs.get(id);
    }

    public getArcs(): Array<Arc> {
        return Array.from(this._arcs.values());
    }

    public addArc(arc: Arc) {
        this._arcs.set(arc.id, arc);
    }

    get frequency(): number | undefined {
        return this._frequency;
    }

    set frequency(value: number | undefined) {
        this._frequency = value;
    }

    public isEmpty(): boolean {
        return this._places.size === 0 && this._transitions.size === 0;
    }

    public clone(): PetriNet {
        return PetriNet.createFromArcSubset(this, this.getArcs());
    }

    public destroy() {
        if (!this._kill$.closed) {
            this._kill$.next();
            this._kill$.complete();
        }
        this._redraw$.complete();
    }

    public bindEvents(mouseMoved$: Subject<MouseEvent>, mouseUp$: Subject<MouseEvent>) {
        this._places.forEach((v, k) => v.bindEvents(mouseMoved$, mouseUp$, this._kill$.asObservable(), this._redraw$));
        this._transitions.forEach((v, k) => v.bindEvents(mouseMoved$, mouseUp$, this._kill$.asObservable(), this._redraw$));
        this._arcs.forEach((v, k) => v.bindEvents(mouseMoved$, mouseUp$, this._kill$.asObservable(), this._redraw$));
    }

    public redrawRequest$(): Observable<void> {
        return this._redraw$.asObservable();
    }
}
