import {Injectable} from "@angular/core";
import {PetriNetLayoutService} from "./petri-net-layout.service";
import {SvgPetriNet} from "../svg-net/svg-petri-net";
import {interval, map, Observable, take, tap} from "rxjs";
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

    private static readonly SPRING_LENGTH = 50;
    private static readonly SPRING_STIFFNESS = 0.5;
    private static readonly NODE_REPULSIVENESS = 0.5;

    private static readonly MAX_ITERATIONS = 20;

    private static readonly INITIAL_SPREAD_DISTANCE = 500;

    layout(net: SvgPetriNet): Observable<BoundingBox> {
        const indices = new Map<string, number>();
        const nodes = net.getMappedNodes();
        nodes.forEach((value, index) => {
            indices.set(value.getId(), index);
        });

        this.placeNodesRandomly(nodes);

        return interval(500).pipe(
            take(SpringEmbedderLayoutService.MAX_ITERATIONS),
            tap(() => {
                this.computeAndApplyForces(nodes, indices, net);
            }),
            map(() => {
                return this.computeBoundingBox(nodes);
            })
        )
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

        // cache distances and deltas of all nodes
        // compute forces between all nodes
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const u = nodes[i];
                const v = nodes[j];
                const deltas = computeDeltas(u, v);
                this.cache(deltaCache, deltas, u, v);
                const dist = computeDistance(deltas);
                this.cache(distanceCache, dist, u, v);

                const nodeForce = this.nodeForce(dist, deltas);
                addPoints(forces[i], nodeForce);
                addPoints(forces[j], nodeForce, -1);
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

            const arcForce = this.arcForce(dist, deltas);
            addPoints(forces[indices.get(s.getId())!], arcForce);
            addPoints(forces[indices.get(d.getId())!], arcForce, -1);
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
        return  cache[u.getId()]![v.getId()];
    }

    private arcForce(distance: number, deltas: Point): Point {
        const coef = SpringEmbedderLayoutService.SPRING_STIFFNESS * (distance - SpringEmbedderLayoutService.SPRING_LENGTH) / distance;
        return {
            x: deltas.x * coef,
            y: deltas.y * coef,
        };
    }

    private nodeForce(distance: number, deltas: Point): Point {
        const coef = SpringEmbedderLayoutService.NODE_REPULSIVENESS / distance / distance / distance;
        return {
            x: deltas.x * coef,
            y: deltas.y * coef,
        }
    }
}
