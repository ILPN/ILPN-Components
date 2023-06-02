import {Injectable} from '@angular/core';
import {PetriNet} from '../../../models/pn/model/petri-net';
import {Marking} from '../../../models/pn/model/marking';
import {PetriNetCoverabilityService} from '../reachability/petri-net-coverability.service';
import {Trace} from "../../../models/log/model/trace";
import {PetriNetReachabilityService} from "../reachability/petri-net-reachability.service";

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
        return this.removePlacesByMarking(net, reachableMarkings);
    }

    /**
     * @param net a labeled Petri Net containing implicit places with no label-splitting
     * @returns a copy of the input Petri net without the implicit places
     */
    public removeImplicitPlaces(net: PetriNet): PetriNet {
        const reachableMarkings = this.generateReachableMarkings(net);
        return this.removePlacesByMarking(net, Array.from(reachableMarkings.values()));
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
                            // p1 is > than some other place p2 => p1 is an implicit place and can be removed from the net
                            removedPlaceIds.add(p1);
                            result.removePlace(p1);
                            continue p1For;
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
}
