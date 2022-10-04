import {Injectable} from '@angular/core';
import {PetriNet} from '../../../models/pn/model/petri-net';
import {Trace} from '../../../models/log/model/trace';
import {LogCleaner} from '../../log/log-cleaner';
import {Marking} from '../../../models/pn/model/marking';
import {PrefixTree} from '../../../utility/prefix-tree';

@Injectable({
    providedIn: 'root'
})
export class ImplicitPlaceRemoverService extends LogCleaner {

    constructor() {
        super();
    }

    /**
     * @param net a labeled Petri Net containing implicit places with no label-splitting and no silent transitions
     * @param log a firing sequences of the labels contained in the net, for which the places are implicit
     * @returns a copy of the input Petri net without the implicit places
     */
    public removeImplicitPlaces(net: PetriNet, log: Array<Trace>): PetriNet {
        const reachableMarkings = this.generateReachableMarkings(net, log);

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
                    if (marking[p1] < marking[p2]) {
                        continue p2For;
                    } else if (marking[p1] > marking[p2]) {
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

    protected generateReachableMarkings(net: PetriNet, log: Array<Trace>): Map<string, Marking> {
        const cleanLog = this.cleanLog(log);

        const labelMapping = this.getLabelMapping(net);
        const initialMarking = net.getInitialMarking();
        const placeOrdering = Object.keys(initialMarking);

        const reachableMarkings = new Map<string, Marking>();
        reachableMarkings.set(this.stringifyMarking(initialMarking, placeOrdering), initialMarking);

        const prefixTree = new PrefixTree<Marking>(initialMarking);
        for (const trace of cleanLog) {
            prefixTree.insert(trace, () => ({}), () => {
            }, undefined, (label, _, oldMarking) => {
                const newMarking = PetriNet.fireTransitionInMarking(net, labelMapping.get(label)!, oldMarking!);
                reachableMarkings.set(this.stringifyMarking(newMarking, placeOrdering), newMarking);
                return newMarking;
            });
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
        return placeOrdering.map(pid => marking[pid]).join(',');
    }
}
