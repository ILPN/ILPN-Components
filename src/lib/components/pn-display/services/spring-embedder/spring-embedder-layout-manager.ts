import {PetriNetLayoutManager} from "../petri-net-layout.manager";
import {SvgPetriNet} from "../../svg-net/svg-petri-net";
import {filter, interval, map, merge, Observable, of, Subject, takeUntil, tap} from "rxjs";
import {addPoints, computeDeltas, computeDistance, Point} from "../../../../utility/svg/point";
import {SvgWrapper} from "../../svg-net/svg-wrapper";
import {SvgTransition} from "../../svg-net/svg-transition";
import {SvgPlace} from "../../svg-net/svg-place";
import {BoundingBox} from "../../../../utility/svg/bounding-box";
import {Cache} from "./internal/cache";
import {StreamFilterState} from "./internal/stream-filter-state";
import {Transition} from "../../../../models/pn/model/transition";
import {Place} from "../../../../models/pn/model/place";
import {BidirectionalMap} from "../../../../utility/bidirectional-map";


/**
 * Spring Embedder algorithm implementation based on: https://medium.com/@ceccarellisimone1/network-force-directed-paradigm-spring-embedder-3f27dc723d3d
 */
export class SpringEmbedderLayoutManager extends PetriNetLayoutManager {

    private static readonly UPDATE_SQUARE_THRESHOLD = 10;

    private static readonly SPRING_LENGTH = 120;
    private static readonly SPRING_STIFFNESS = 1 / 8;
    private static readonly NODE_REPULSIVENESS = 25000;
    private static readonly IO_SIDE_ATTRACTION_START = 20;
    private static readonly IO_SIDE_ATTRACTION_END = 1;
    private static readonly ARC_ROTATION_FORCE_FACTOR = 0;
    private static readonly GRID_FORCE_FACTOR = 0;

    private static readonly MAX_ITERATIONS = 60;
    private static readonly OVERLAY_FIXED_ITERATIONS = Math.floor(SpringEmbedderLayoutManager.MAX_ITERATIONS / 2);

    private static readonly INITIAL_SPREAD_DISTANCE = 500;
    private static readonly GRID_SIZE = 120;
    private static readonly HALF_GRID_SIZE = SpringEmbedderLayoutManager.GRID_SIZE / 2;

    private readonly _streamFilterState: StreamFilterState;
    private _killInterval$: Subject<void> | undefined;
    private _currentNet: SvgPetriNet | undefined;

    constructor() {
        super();
        this._streamFilterState = new StreamFilterState(SpringEmbedderLayoutManager.MAX_ITERATIONS);
    }

    private placeNodesAndLayout(net: SvgPetriNet, placeNodes: (nodes: Array<SvgTransition | SvgPlace>) => void, unfixAfter?: number) {
        const cacheIndices = new Map<string, number>();
        const nodes = net.getMappedNodes();
        nodes.forEach((value, index) => {
            cacheIndices.set(value.getId(), index);
        });

        if (this._killInterval$ !== undefined) {
            this._killInterval$.next();
        } else {
            this._killInterval$ = new Subject<void>();
        }

        placeNodes(nodes);

        this._currentNet = net;
        this._streamFilterState.reset();

        return merge(
            of(this.computeBoundingBox(nodes)),
            interval(1).pipe(
                takeUntil(this._killInterval$.asObservable()),
                filter(() => this._streamFilterState.filter()),
                map( () => this._streamFilterState.currentIteration()),
                tap((iter: number) => {
                    if (unfixAfter !== undefined && iter === unfixAfter) {
                        for (const n of this._currentNet!.getMappedNodes()) {
                            n.isFixed = false;
                        }
                    }

                    for (let i = 0; i < 10; i++) {
                        this.computeAndApplyForces(nodes, cacheIndices, net, iter);
                    }
                }),
                map(() => {
                    return this.computeBoundingBox(nodes);
                })
            )
        );
    }

    layout(net: SvgPetriNet): Observable<BoundingBox> {
        return this.placeNodesAndLayout(net, nodes => {
            for (const n of nodes) {
                this.placeNodeRandomly(n);
            }
        });
    }

    /**
     * If both the previous and the new nets are unlabeled,
     * maps the same labels to the same positions,
     * maps the same places to the positions of previous places,
     * maps new places in between existing transitions,
     * maps new elements (places, transitions) randomly near their existing connections (if any)
     * and lets the elements settle in accordance to the spring embedder rules.
     */
    override overlayLayout(net: SvgPetriNet): Observable<BoundingBox> {
        if (this._currentNet === undefined) {
            return this.layout(net);
        }
        if (this._currentNet.getNet().hasMoreThanNTransitionsWithTheSameLabel(1) || net.getNet().hasMoreThanNTransitionsWithTheSameLabel(1)) {
            console.debug('Either the previous, or the new net has duplicate labels! Currently unsupported. Running standard layout instead.');
            return this.layout(net);
        }

        return this.placeNodesAndLayout(net, nodes => {
            this.placeNodesOverlay(net, nodes);
        }, SpringEmbedderLayoutManager.OVERLAY_FIXED_ITERATIONS);
    }

    override destroy() {
        super.destroy();
        if (this._killInterval$ !== undefined) {
            this._killInterval$.next();
            this._killInterval$.complete();
        }
    }

    private placeNodeRandomly(node: SvgTransition | SvgPlace) {
        const angle = Math.random() * 2 * Math.PI;
        const distance = Math.random() * SpringEmbedderLayoutManager.INITIAL_SPREAD_DISTANCE;

        node.center = {
            x: Math.cos(angle) * distance,
            y: Math.sin(angle) * distance
        };
    }

    private placeNodesOverlay(net: SvgPetriNet, nodes: Array<SvgTransition | SvgPlace>) {
        // assumes the previous and current nets are unlabeled

        const oldTransitions = new Map<string | undefined, SvgTransition>();
        for (const old of this._currentNet!.getMappedNodes()) {
            if (old instanceof SvgPlace) {
                continue;
            }
            oldTransitions.set(old.getLabel(), old);
        }

        const oldNewMap = new BidirectionalMap<Transition, Transition>();
        const unsorted: Array<SvgTransition | SvgPlace> = [];

        // place nodes with pairs at their previous positions and fix them
        for (const newNode of nodes) {
            if (newNode instanceof SvgTransition) {
                const old = oldTransitions.get(newNode.getLabel());
                if (old === undefined) {
                    unsorted.push(newNode);
                } else {
                    oldNewMap.set(this._currentNet!.getInverseMappedTransition(old)!, net.getInverseMappedTransition(newNode)!);
                    newNode.center = old.center;
                    newNode.isFixed = true;
                }
                continue;
            }

            // SvgPlace
            // implementation relies on the fact, that all transitions are iterated over before all places!
            const place = net.getInverseMappedPlace(newNode)!;
            const oldPlace = this.findMatchingPlace(place, oldNewMap);
            if (oldPlace === undefined) {
                unsorted.push(newNode);
                continue;
            }

            const oldNode = this._currentNet!.getMappedPlace(oldPlace)!;
            newNode.center = oldNode.center;
            newNode.isFixed = true;
        }

        // place nodes without pairs, but with all connections paired in the center point
        // place the rest randomly
        for (const unsortedNode of unsorted) {
            const unwrapped = net.getInverseMappedNode(unsortedNode)!;
            const preset = unwrapped.ingoingArcs.map(a => net.getMappedWrapper(a.source)!);
            if (preset.some(pre => !pre.isFixed)) {
                this.placeNodeRandomly(unsortedNode);
                continue;
            }
            const postset = unwrapped.outgoingArcs.map(a => net.getMappedWrapper(a.destination)!);
            if (postset.some(post => !post.isFixed)) {
                this.placeNodeRandomly(unsortedNode);
                continue;
            }
            const sum: Point = {x: 0, y: 0};
            for (const n of [...preset, ...postset]) {
                sum.x += n.x;
                sum.y += n.y;
            }
            const count = preset.length + postset.length;
            sum.x /= count;
            sum.y /= count;
            unsortedNode.center = sum;
        }
    }

    private findMatchingPlace(newPlace: Place, oldNewTransitions: BidirectionalMap<Transition, Transition>): undefined | Place {
        if (newPlace.ingoingArcWeights.size > 0) {
            const arc = newPlace.ingoingArcs[0];
            const source = oldNewTransitions.getInverse(arc.sourceId);
            if (source === undefined) {
                return undefined;
            }
            return this.compareArcs(newPlace, source.outgoingArcs.map(a => a.destination as Place), oldNewTransitions);
        } else if (newPlace.outgoingArcWeights.size > 0) {
            const arc = newPlace.outgoingArcs[0];
            const dest = oldNewTransitions.getInverse(arc.destinationId);
            if (dest === undefined) {
                return undefined;
            }
            return this.compareArcs(newPlace, dest.ingoingArcs.map(a => a.source as Place), oldNewTransitions);
        }
        return undefined;
    }

    private compareArcs(newPlace: Place, oldCandidates: Array<Place>, oldNewTransitions: BidirectionalMap<Transition, Transition>): undefined | Place {
        for (const oldPlace of oldCandidates) {
            if (newPlace.ingoingArcWeights.size !== oldPlace.ingoingArcWeights.size) {
                continue;
            }
            if (newPlace.outgoingArcWeights.size !== oldPlace.outgoingArcWeights.size) {
                continue;
            }
            if (this.areMapsEqual(newPlace.ingoingArcWeights, oldPlace.ingoingArcWeights, oldNewTransitions) && this.areMapsEqual(newPlace.outgoingArcWeights, oldPlace.outgoingArcWeights, oldNewTransitions)) {
                return oldPlace;
            }
        }
        return undefined;
    }

    private areMapsEqual(mapB: Map<string, number>, mapA: Map<string, number>, mappingBA: BidirectionalMap<Transition, Transition>): boolean {
        // assumes sizes are the same!
        for (const [idB, weightB] of mapB.entries()) {
            const idA = mappingBA.getInverseId(idB);
            if (idA === undefined) {
                return false;
            }
            if (weightB !== mapA.get(idA)) {
                return false;
            }
        }
        return true;
    }

    private computeAndApplyForces(nodes: Array<SvgTransition | SvgPlace>, cacheIndices: Map<string, number>, net: SvgPetriNet, iter: number) {
        const distanceCache: Cache<number> = {};
        const deltaCache: Cache<Point> = {};

        const forces: Array<Point> = nodes.map((n, i) => ({x: 0, y: 0}));

        const ioAttraction = SpringEmbedderLayoutManager.IO_SIDE_ATTRACTION_START - ((SpringEmbedderLayoutManager.IO_SIDE_ATTRACTION_START - SpringEmbedderLayoutManager.IO_SIDE_ATTRACTION_END) / SpringEmbedderLayoutManager.MAX_ITERATIONS * iter);

        for (let i = 0; i < nodes.length; i++) {
            const u = nodes[i];

            // cache distances and deltas of all nodes
            // compute forces between all nodes
            for (let j = i + 1; j < nodes.length; j++) {
                const v = nodes[j];
                const deltas = computeDeltas(u, v);
                this.cache(deltaCache, deltas, u, v);
                const dist = computeDistance(deltas);
                this.cache(distanceCache, dist, u, v);

                const nodeForce = this.nodeForce(dist, deltas);
                addPoints(forces[i], nodeForce, -1);
                addPoints(forces[j], nodeForce);
            }

            // compute forces affecting individual nodes
            const netNode = net.getInverseMappedNode(u)!;
            if (netNode.ingoingArcWeights.size === 0) {
                // no ingoing arcs => pulled to the left
                addPoints(forces[i], {x: -ioAttraction, y: 0});
            }
            if (netNode.outgoingArcWeights.size === 0) {
                // no outgoing arcs => pulled to the right
                addPoints(forces[i], {x: ioAttraction, y: 0});
            }
            // addPoints(forces[i], this.gridForce(u), f*f);
        }

        // compute arc forces, reuse cached data
        for (const a of net.getMappedArcs()) {
            let s = a.source;
            let d = a.destination;
            let dist = this.read(distanceCache, s, d);
            if (dist === undefined) {
                dist = this.read(distanceCache, d, s);
                if (dist === undefined) {
                    throw new Error(`Cache miss! (a,b), nor (b,a) is cached!`);
                }
                s = d;
                d = a.source;
            }
            const deltas = this.read(deltaCache, s, d)!;

            const arcAttractionForce = this.arcAttractionForce(dist, deltas);
            const arcRotationForce = this.arcRotationForce(deltas);

            addPoints(forces[cacheIndices.get(s.getId())!], arcAttractionForce);
            addPoints(forces[cacheIndices.get(s.getId())!], arcRotationForce, -1);

            addPoints(forces[cacheIndices.get(d.getId())!], arcAttractionForce, -1);
            addPoints(forces[cacheIndices.get(d.getId())!], arcRotationForce);
        }

        // apply forces
        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            if (node.isFixed) {
                continue;
            }
            const force = forces[i];
            const newCenter = node.cloneCenter();
            addPoints(newCenter, force);
            node.center = newCenter;
        }
    }

    private cache<T>(cache: Cache<T>, value: T, u: SvgWrapper, v: SvgWrapper) {
        if (cache[u.getId()] === undefined) {
            cache[u.getId()] = {[v.getId()]: value};
        } else {
            cache[u.getId()]![v.getId()] = value;
        }
    }

    private read<T>(cache: Cache<T>, u: SvgWrapper, v: SvgWrapper): T | undefined {
        if (cache[u.getId()] === undefined) {
            return undefined;
        }
        return cache[u.getId()]![v.getId()];
    }

    /**
     * Computes the attraction/repulsion force between two nodes connected by an arc,
     * caused by the arcs "springiness" (the arc is a spring and has a preferred length).
     * The force is always tangential to the arc.
     */
    private arcAttractionForce(distance: number, deltas: Point): Point {
        if (distance === 0) {
            return {
                x: 0,
                y: 0,
            };
        }

        const coef = SpringEmbedderLayoutManager.SPRING_STIFFNESS * (distance - SpringEmbedderLayoutManager.SPRING_LENGTH) / distance;
        return {
            x: deltas.x * coef,
            y: deltas.y * coef,
        };
    }

    /**
     * Computes the rotational force on the two endpoints of an arc.
     * The arc wants to be oriented at an angle, that is a multiple of 45° (pi/4)
     */
    private arcRotationForce(deltas: Point, FORCE_FACTOR = SpringEmbedderLayoutManager.ARC_ROTATION_FORCE_FACTOR): Point {
        // currently, the factor with which this force is applied is 0 => no force. For unit testing purposes, this factor can be overridden.

        const angle = this.vectorAngle(deltas);

        // don't apply any force, if the arc is oriented correctly?
        let section = angle + 2 * Math.PI;
        section /= (Math.PI / 8);
        section = Math.floor(section);
        section = (section + 17) % 16;
        // There are 16 different "triangular" regions of the plane where we have to apply different forces
        // the `angle` is a number 0-15, determining in which of these regions the destination of the arc lies
        // regions 0 and 1 must force the points towards the positive X axis (in opposite directions); regions 2,3 to the x = y line etc.

        const odd = section % 2 === 1;
        if (odd) {
            section -= 1;
        }
        section = section / 2;

        const planeOctantAngle = section / 4 * Math.PI;
        const distanceToLine = Math.abs(Math.sin(angle) * deltas.x - Math.cos(angle) * deltas.y);
        const factor = distanceToLine * FORCE_FACTOR;

        let destForce = {
            x: -Math.sin(planeOctantAngle) * factor,
            y: Math.cos(planeOctantAngle) * factor,
        };

        if (odd) {
            destForce.x *= -1;
            destForce.y *= -1;
        }

        return destForce;
    }

    private nodeForce(distance: number, deltas: Point): Point {
        if (distance === 0) {
            return {
                x: 0,
                y: 0,
            };
        }

        const coef = SpringEmbedderLayoutManager.NODE_REPULSIVENESS / distance / distance / distance;
        return {
            x: deltas.x * coef,
            y: deltas.y * coef,
        }
    }

    private gridForce(coords: Point): Point {
        return {
            x: 0,//this.gridAxisForce(coords.x) * SpringEmbedderLayoutService.GRID_FORCE_FACTOR,
            y: this.gridAxisForce(coords.y) * SpringEmbedderLayoutManager.GRID_FORCE_FACTOR,
        }
    }

    private gridAxisForce(coord: number): number {
        const rest = coord % SpringEmbedderLayoutManager.GRID_SIZE;
        if (rest <= SpringEmbedderLayoutManager.HALF_GRID_SIZE
            && rest >= -SpringEmbedderLayoutManager.HALF_GRID_SIZE) {
            return -rest;
        }
        const sign = Math.sign(rest);
        return sign * SpringEmbedderLayoutManager.GRID_SIZE - coord;
    }

    private vectorAngle(deltas: Point): number {
        return Math.atan2(deltas.y, deltas.x);
    }

    getMouseMovedReaction(wrapper: SvgWrapper): (e: MouseEvent) => void {
        return (e) => {
            wrapper.processMouseMovedFree(e);
            if (wrapper.dragging) {
                this._streamFilterState.reset(Math.floor(SpringEmbedderLayoutManager.MAX_ITERATIONS * 0.8));
            }
        };
    }
}
