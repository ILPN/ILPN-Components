import {Injectable} from '@angular/core';
import {PetriNet} from '../../../models/pn/model/petri-net';
import {Marking} from '../../../models/pn/model/marking';
import {PetriNetCoverabilityService} from '../reachability/petri-net-coverability.service';
import {Trace} from "../../../models/log/model/trace";
import {PetriNetReachabilityService} from "../reachability/petri-net-reachability.service";
import {Place} from "../../../models/pn/model/place";

@Injectable({
    providedIn: 'root'
})
export class ImplicitPlaceRemoverService {

    constructor(protected _coverabilityTreeService: PetriNetCoverabilityService,
                protected _reachabilityService: PetriNetReachabilityService) {
    }

    public removeImplicitPlacesBasedOnTraces(net: PetriNet, traces: Array<Trace>): PetriNet {
        // roughly based on:  https://ceur-ws.org/Vol-2625/paper-02.pdf

        const reachableMarkings = this._reachabilityService.getMarkingsReachableByTraces(net, traces);
        reachableMarkings.push(...this._reachabilityService.getReachableMarkings(net));
        const r = this.removePlacesByMarking(net, reachableMarkings);
        this.removeFakeEndStates(r);
        return r;
    }

    /**
     * @param net a labeled Petri Net containing implicit places with no label-splitting
     * @returns a copy of the input Petri net without the implicit places
     */
    public removeImplicitPlaces(net: PetriNet): PetriNet {
        // const reachableMarkings = this.generateReachableMarkings(net);
        // return this.removePlacesByMarking(net, Array.from(reachableMarkings.values()));
        return this.removePlacesByMarking(net, this._reachabilityService.getReachableMarkings(net));
    }

    protected removePlacesByMarking(net: PetriNet, markings: Array<Marking>): PetriNet {
        const placeOrdering = net.getPlaces().map(p => p.getId());
        const removedPlaceIds = new Set<string>();
        const result = net.clone();

        p1For:
            for (const p1 of placeOrdering) {
                if (removedPlaceIds.has(p1)) {
                    continue;
                }

                p2For:
                    for (const p2 of placeOrdering) {
                        if (removedPlaceIds.has(p2)) {
                            continue;
                        }
                        if (p1 === p2) {
                            continue;
                        }

                        let isGreater = false;
                        for (const marking of markings) {
                            if (marking.get(p1)! < marking.get(p2)!) {
                                continue p2For;
                            } else if (marking.get(p1)! > marking.get(p2)!) {
                                isGreater = true;
                            }
                        }

                        if (isGreater) {
                            // p1 is > than some other place p2
                            // we can compute a new place p3 = p1 - p2
                            // if p3 is present in the net p1 is implicit and can be removed

                            // if (this.computeAndCheckReplacement(net, p1, p2)) {
                                removedPlaceIds.add(p1);
                                result.removePlace(p1);
                                continue p1For;
                            // }
                        }
                    }
            }

        return result;
    }

    protected generateReachableMarkings(net: PetriNet): Map<string, Marking> {
        const reachableMarkings = new Map<string, Marking>();
        const toExplore = [this._coverabilityTreeService.getCoverabilityTree(net)];
        const placeOrdering = toExplore[0].omegaMarking.getKeys();

        while (toExplore.length > 0) {
            const next = toExplore.shift()!;
            toExplore.push(...next.getChildren())
            const m = next.omegaMarking;
            reachableMarkings.set(m.serialise(placeOrdering), m);
        }

        return reachableMarkings;
    }

    protected computeAndCheckReplacement(net: PetriNet, p1Id: string, p2Id: string): boolean {
        const p1 = net.getPlace(p1Id)!;
        const p2 = net.getPlace(p2Id)!;

        const regionGradient = this.computeRegionGradient(p1);
        const p2Gradient = this.computeRegionGradient(p2);

        // p3 = p1 - p2
        for (const [t, w] of p2Gradient) {
            const gradient = regionGradient.get(t);
            if (gradient === undefined) {
                regionGradient.set(t, -w);
            } else {
                regionGradient.set(t, gradient - w);
            }
        }

        const preset = new Map<string, number>();
        const postset = new Map<string, number>();
        for (const [t, w] of regionGradient) {
            if (w > 0) {
                preset.set(t, w);
            } else if (w < 0) {
                postset.set(t, -w);
            }
        }

        return net.getPlaces().some(p => {
            for (const [t, w] of preset) {
                if (p.ingoingArcWeights.get(t) !== w) {
                    return false;
                }
            }
            for (const [t, w] of postset) {
                if (p.outgoingArcWeights.get(t) !== w) {
                    return false;
                }
            }
            return true;
        });
    }

    protected computeRegionGradient(p: Place): Map<string, number> {
        const regionGradient = new Map(p.ingoingArcWeights);
        for (const [t, w] of p.outgoingArcWeights) {
            const gradient = regionGradient.get(t);
            if (gradient === undefined) {
                regionGradient.set(t, -w);
            } else {
                throw new Error('self-loops are not supported!');
                // regionGradient.set(t, gradient - w);
            }
        }
        return regionGradient;
    }

    private removeFakeEndStates(net: PetriNet) {
        for (const p of net.getPlaces()) {
            if (p.ingoingArcWeights.size === 0) {
                continue;
            }

            const pre = p.ingoingArcs.map(a => a.source);

            if (p.outgoingArcWeights.size === 0 && pre.every(t => t.outgoingArcWeights.size > 1)) {
                net.removePlace(p);
            }
        }
    }
}
