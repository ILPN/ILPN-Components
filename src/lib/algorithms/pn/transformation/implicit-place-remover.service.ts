import {Injectable} from '@angular/core';
import {PetriNet} from '../../../models/pn/model/petri-net';
import {Marking} from '../../../models/pn/model/marking';
import {PetriNetReachabilityService} from "../reachability/petri-net-reachability.service";
import {MarkingWithEnabledTransitions} from "../reachability/model/marking-with-enabled-transitions";
import {Transition} from "../../../models/pn/model/transition";

@Injectable({
    providedIn: 'root'
})
export class ImplicitPlaceRemoverService {

    constructor(protected _reachabilityService: PetriNetReachabilityService) {
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

    protected removePlacesByMarking(net: PetriNet, markings: Array<MarkingWithEnabledTransitions>): PetriNet {
        const placeOrdering = net.getPlaces().map(p => p.getId());
        const removedPlaceIds = new Set<string>();
        const result = net.clone();

        console.debug(`inspecting ${net.getPlaceCount()} places to remove implicit ones based on ${markings.length} reachable markings`);

        const originalMarkingSize = result.getPlaceCount();

        for (const p of placeOrdering) {
            const inspectedPlace = net.getPlace(p);
            if (inspectedPlace === undefined) {
                throw new Error(`Illegal state. Inspected place with id ${p} is not in net!`);
            }

            const postset = inspectedPlace.outgoingArcs.map(a => a.destination) as Array<Transition>;

            let implicit = true;

            if (postset.length > 0) {
                forMarkings:
                    for (const rm of markings) {
                        this.trimMarking(rm.marking, removedPlaceIds, originalMarkingSize);
                        if (!rm.evaluatedEnabledTransitions) {
                            rm.addEnabledTransitions(PetriNet.getAllEnabledTransitions(result, rm.marking));
                        }

                        const reduced = new Marking(rm.marking);
                        reduced.delete(p);

                        for (const t of postset) {
                            if (PetriNet.isTransitionEnabledInMarking(result, t.getId(), reduced, true)
                                && !rm.enabledTransitions.includes(t.getId())) {
                                // removing the place would enable a new transition in some marking => NOT implicit
                                implicit = false;
                                break forMarkings;
                            }
                        }
                    }
            }

            if (implicit) {
                const preset = inspectedPlace.ingoingArcs.map(a => a.source) as Array<Transition>;
                if (preset.some(t => t.outgoingArcWeights.size === 1)) {
                    // we don't want to delete a place if this is the only place in the postset of some transition
                    continue;
                }

                result.removePlace(inspectedPlace);
                removedPlaceIds.add(p);
            }
        }

        return result;
    }

    private trimMarking(marking: Marking, removedPlaceIds: Set<string>, originalSize: number) {
        const expectedSize = originalSize - removedPlaceIds.size;
        if (marking.size === expectedSize) {
            return;
        }
        if (marking.size > expectedSize) {
            for (const p of removedPlaceIds) {
                marking.delete(p);
            }
            return;
        } else {
            throw new Error('Unexpected state. Marking size is less than expected');
        }
    }
}
