import {Injectable} from '@angular/core';
import {PetriNet} from '../../../models/pn/model/petri-net';
import {Place} from '../../../models/pn/model/place';
import {Transition} from '../../../models/pn/model/transition';
import {PetriNetIsomorphismService} from '../../pn/isomorphism/petri-net-isomorphism.service';


interface ConflictingPlace {
    target: Place;
    conflict: Place;
}

@Injectable({
    providedIn: 'root'
})
export class BranchingProcessFoldingService {

    constructor(private _isomorphism: PetriNetIsomorphismService) {
    }

    public foldPartialOrders(pos: Array<PetriNet>): PetriNet {
        if (pos.length === 0) {
            return new PetriNet();
        }
        const result = pos[0].clone();

        if (result.inputPlaces.size > 1) {
            throw new Error('Folding of initially concurrent processes is currently unsupported!');
        }

        for (let i = 1; i < pos.length; i++) {
            this.addPoToBranchingProcess(pos[i], result);
        }

        return result;
    }

    private addPoToBranchingProcess(po: PetriNet, result: PetriNet) {
        if (po.inputPlaces.size > 1) {
            throw new Error('Folding of initially concurrent processes is currently unsupported!');
        }

        const conflictingPlaces: Array<ConflictingPlace> = [{
            target: result.getInputPlaces()[0],
            conflict: po.getInputPlaces()[0]
        }]

        while (conflictingPlaces.length > 0) {
            const problem = conflictingPlaces.shift()!;
            const followingEvent = problem.conflict.outgoingArcs[0]?.destination as Transition;
            if (followingEvent === undefined) {
                // the conflicting place has no following event => there is no conflict to resolve
                continue;
            }

            let folding: Map<string, string> | undefined;
            for (const a of problem.target.outgoingArcs) {
                const foldedEvent = a.destination as Transition;
                if (foldedEvent.label !== followingEvent.label) {
                    continue;
                }

                folding = this.attemptEventFolding(followingEvent, foldedEvent);
                if (folding !== undefined) {
                    break;
                }
            }

            if (folding !== undefined) {
                // the conflict can be resolved and the target place can be folded => move the conflict to the following places

                for (const [targetId, conflictId] of folding.entries()) {
                    conflictingPlaces.push({
                        target: result.getPlace(targetId)!,
                        conflict: po.getPlace(conflictId)!
                    });
                }
            } else {
                // the conflict cannot be resolved => add conflict to the folded net

                this.addConflict(problem.conflict, problem.target, result);
            }

        }

        return result;
    }

    private attemptEventFolding(following: Transition, folded: Transition): Map<string, string> | undefined {
        if (folded.outgoingArcs.length !== following.outgoingArcs.length) {
            return undefined;
        }

        const mapping = new Map<string, string>();
        const mapped = new Set<string>();

        const unmapped = following.outgoingArcs.map(a => a.destination as Place);

        while (unmapped.length > 0) {
            const p = unmapped.shift()!;

            if (p.outgoingArcs.length === 0) {
                if (unmapped.length !== 0) {
                    unmapped.push(p);
                    continue;
                } else {
                    for (const af of folded.outgoingArcs) {
                        const pf = af.destination as Place;
                        if (mapped.has(pf.id!)) {
                            continue;
                        }
                        mapping.set(p.id!, pf.id!);
                        break;
                    }
                    break;
                }
            }

            const followLabel = (p.outgoingArcs[0].destination as Transition).label;

            mappingFor:
                for (const af of folded.outgoingArcs) {
                    const pf = af.destination as Place;
                    if (mapped.has(pf.id!)) {
                        continue;
                    }

                    for (const ap of pf.outgoingArcs) {
                        if ((ap.destination as Transition).label === followLabel) {
                            mapping.set(p.id!, pf.id!);
                            mapped.add(pf.id!);
                            break mappingFor;
                        }
                    }
                }

            if (!mapping.has(p.id!)) {
                return undefined;
            }
        }

        return mapping;
    }

    private addConflict(conflict: Place, target: Place, folded: PetriNet) {
        if (conflict.outgoingArcs.length === 0) {
            return;
        }

        const original = conflict.outgoingArcs[0].destination as Transition;
        const following = new Transition(original.label);
        folded.addTransition(following);
        folded.addArc(target, following);

        for (const out of original.outgoingArcs) {
            const p = new Place();
            folded.addPlace(p);
            folded.addArc(following, p);

            // TODO support merging flows
            this.addConflict(out.destination as Place, p, folded);
        }
    }
}
