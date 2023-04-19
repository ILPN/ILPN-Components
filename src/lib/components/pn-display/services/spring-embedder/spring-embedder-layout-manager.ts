import {PetriNetLayoutManager} from "../petri-net-layout.manager";
import {SvgPetriNet} from "../../svg-net/svg-petri-net";
import {filter, interval, map, merge, Observable, of, tap} from "rxjs";
import {addPoints, computeDeltas, computeDistance, Point} from "../../../../utility/svg/point";
import {SvgWrapper} from "../../svg-net/svg-wrapper";
import {SvgTransition} from "../../svg-net/svg-transition";
import {SvgPlace} from "../../svg-net/svg-place";
import {BoundingBox} from "../../../../utility/svg/bounding-box";
import {Cache} from "./internal/cache";
import {StreamFilterState} from "./internal/stream-filter-state";


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

    private static readonly INITIAL_SPREAD_DISTANCE = 500;
    private static readonly GRID_SIZE = 120;
    private static readonly HALF_GRID_SIZE = SpringEmbedderLayoutManager.GRID_SIZE / 2;

    private readonly _streamFilterState: StreamFilterState;

    constructor() {
        super();
        this._streamFilterState = new StreamFilterState(SpringEmbedderLayoutManager.MAX_ITERATIONS);
    }

    layout(net: SvgPetriNet): Observable<BoundingBox> {
        const indices = new Map<string, number>();
        const nodes = net.getMappedNodes();
        nodes.forEach((value, index) => {
            indices.set(value.getId(), index);
        });

        this._streamFilterState.reset();

        this.placeNodesRandomly(nodes);

        return merge(
            of(this.computeBoundingBox(nodes)),
            interval(1).pipe(
                filter(() => this._streamFilterState.filter()),
                map( () => this._streamFilterState.currentIteration()),
                tap((iter: number) => {
                    for (let i = 0; i < 10; i++) {
                        this.computeAndApplyForces(nodes, indices, net, iter);
                    }
                }),
                map(() => {
                    return this.computeBoundingBox(nodes);
                })
            )
        );
    }

    private placeNodesRandomly(nodes: Array<SvgTransition | SvgPlace>) {
        for (const n of nodes) {
            const angle = Math.random() * 2 * Math.PI;
            const distance = Math.random() * SpringEmbedderLayoutManager.INITIAL_SPREAD_DISTANCE;

            n.center = {
                x: Math.cos(angle) * distance,
                y: Math.sin(angle) * distance
            };
        }
    }

    private computeAndApplyForces(nodes: Array<SvgTransition | SvgPlace>, indices: Map<string, number>, net: SvgPetriNet, iter: number) {
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

            addPoints(forces[indices.get(s.getId())!], arcAttractionForce);
            addPoints(forces[indices.get(s.getId())!], arcRotationForce, -1);

            addPoints(forces[indices.get(d.getId())!], arcAttractionForce, -1);
            addPoints(forces[indices.get(d.getId())!], arcRotationForce);
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
    private arcRotationForce(deltas: Point): Point {
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
        const factor = distanceToLine * SpringEmbedderLayoutManager.ARC_ROTATION_FORCE_FACTOR;

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
                this._streamFilterState.reset();
            }
        };
    }
}
