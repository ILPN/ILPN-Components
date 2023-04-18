import {Injectable} from "@angular/core";
import {PetriNetLayoutService} from "./petri-net-layout.service";
import {SvgPetriNet} from "../svg-net/svg-petri-net";
import {interval, map, merge, Observable, of, take, tap} from "rxjs";
import {addPoints, computeDeltas, computeDistance, Point} from "../../../utility/svg/point";
import {SvgWrapper} from "../svg-net/svg-wrapper";
import {SvgTransition} from "../svg-net/svg-transition";
import {SvgPlace} from "../svg-net/svg-place";
import {BoundingBox} from "../../../utility/svg/bounding-box";


type Cache<T> = { [k: string]: { [k: string]: T | undefined } | undefined };


/**
 * Spring Embedder algorithm implementation based on: https://medium.com/@ceccarellisimone1/network-force-directed-paradigm-spring-embedder-3f27dc723d3d
 */
@Injectable({
    providedIn: 'root'
})
export class SpringEmbedderLayoutService extends PetriNetLayoutService {

    private static readonly SPRING_LENGTH = 80;
    private static readonly SPRING_STIFFNESS = 0.1;
    private static readonly NODE_REPULSIVENESS = 25000;
    private static readonly IO_SIDE_ATTRACTION = 15;
    private static readonly ARC_ROTATION_FORCE = 1;

    private static readonly MAX_ITERATIONS = 3000;

    private static readonly INITIAL_SPREAD_DISTANCE = 500;

    layout(net: SvgPetriNet): Observable<BoundingBox> {
        const indices = new Map<string, number>();
        const nodes = net.getMappedNodes();
        nodes.forEach((value, index) => {
            indices.set(value.getId(), index);
        });

        this.placeNodesRandomly(nodes);

        return merge(
            of(this.computeBoundingBox(nodes)),
            interval(10).pipe(
                take(SpringEmbedderLayoutService.MAX_ITERATIONS),
                tap(() => {
                    this.computeAndApplyForces(nodes, indices, net);
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
            const distance = Math.random() * SpringEmbedderLayoutService.INITIAL_SPREAD_DISTANCE;

            n.center = {
                x: Math.cos(angle) * distance,
                y: Math.sin(angle) * distance
            };
        }
    }

    private computeAndApplyForces(nodes: Array<SvgTransition | SvgPlace>, indices: Map<string, number>, net: SvgPetriNet) {
        const distanceCache: Cache<number> = {};
        const deltaCache: Cache<Point> = {};

        const forces: Array<Point> = nodes.map((n, i) => ({x: 0, y: 0}));

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
                addPoints(forces[i], {x: -SpringEmbedderLayoutService.IO_SIDE_ATTRACTION, y: 0});
            }
            if (netNode.outgoingArcWeights.size === 0) {
                // no outgoing arcs => pulled to the right
                addPoints(forces[i], {x: SpringEmbedderLayoutService.IO_SIDE_ATTRACTION, y: 0});
            }
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
        const coef = SpringEmbedderLayoutService.SPRING_STIFFNESS * (distance - SpringEmbedderLayoutService.SPRING_LENGTH) / distance;
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
        let angle = this.vectorAngle(deltas);

        // don't apply any force, if the arc is oriented correctly?
        angle += 2 * Math.PI;
        angle /= (Math.PI / 8);
        angle = Math.floor(angle);
        angle = (angle + 17) % 16;
        // There are 16 different "triangular" regions of the plane where we have to apply different forces
        // the `angle` is a number 0-15, determining in which of these regions the destination of the arc lies
        // regions 0 and 1 must force the points towards the positive X axis (in opposite directions); regions 2,3 to the x = y line etc.

        const odd = angle % 2 === 1;
        let planeOctant = angle;
        if (odd) {
            planeOctant -= 1;
        }
        planeOctant = planeOctant / 2;

        const planeOctantAngle = planeOctant / 4 * Math.PI;

        let destForce = {
            x: -Math.sin(planeOctantAngle) * SpringEmbedderLayoutService.ARC_ROTATION_FORCE,
            y: Math.cos(planeOctantAngle) * SpringEmbedderLayoutService.ARC_ROTATION_FORCE,
        };

        if (odd) {
            destForce.x *= -1;
            destForce.y *= -1;
        }

        return destForce;
    }

    private nodeForce(distance: number, deltas: Point): Point {
        const coef = SpringEmbedderLayoutService.NODE_REPULSIVENESS / distance / distance / distance;
        return {
            x: deltas.x * coef,
            y: deltas.y * coef,
        }
    }

    private vectorAngle(deltas: Point): number {
        return Math.atan2(deltas.y, deltas.x);
    }

    getMouseMovedReaction(wrapper: SvgWrapper): (e: MouseEvent) => void {
        return (e) => {
            wrapper.processMouseMovedFree(e);
        };
    }
}
