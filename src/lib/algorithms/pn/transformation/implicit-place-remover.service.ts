import {Injectable} from '@angular/core';
import {PetriNet} from '../../../models/pn/model/petri-net';
import {LogCleaner} from '../../log/log-cleaner';
import {Marking} from '../../../models/pn/model/marking';
import {PetriNetCoverabilityService} from '../reachability/petri-net-coverability.service';

@Injectable({
    providedIn: 'root'
})
export class ImplicitPlaceRemoverService extends LogCleaner {

    constructor(protected _coverabilityTreeService: PetriNetCoverabilityService) {
        super();
    }

    /**
     * @param net a labeled Petri Net containing implicit places with no label-splitting
     * @returns a copy of the input Petri net without the implicit places
     */
    public removeImplicitPlaces(net: PetriNet): PetriNet {
        const reachableMarkings = this.generateReachableMarkings(net);

        const placeOrdering = net.getPlaces().map(p => p.id!);
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
                for (const marking of reachableMarkings.values()) {
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
            reachableMarkings.set(this.stringifyMarking(m, placeOrdering), m);
        }

        return reachableMarkings;
    }

    protected getLabelMapping(net: PetriNet): Map<string, string> {
        const result = new Map<string, string>();
        for (const t of net.getTransitions()) {
            if (t.label === undefined) {
                throw new Error(`Silent transitions are unsupported! The transition with id '${t.id}' has no label`);
            }
            if (result.has(t.label!)) {
                throw new Error(`Label splitting is not supported! The label '${t.label}' is shared by at least two transitions`);
            }
            result.set(t.label, t.id!);
        }
        return result;
    }

    protected stringifyMarking(marking: Marking, placeOrdering: Array<string>): string {
        return placeOrdering.map(pid => marking.get(pid)).join(',');
    }
}
