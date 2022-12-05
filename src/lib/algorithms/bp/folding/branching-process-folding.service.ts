import {Injectable} from '@angular/core';
import {PetriNet} from '../../../models/pn/model/petri-net';
import {Place} from '../../../models/pn/model/place';
import {Transition} from '../../../models/pn/model/transition';
import {PetriNetIsomorphismService} from '../../pn/isomorphism/petri-net-isomorphism.service';
import {Mapping} from '../../pn/isomorphism/classes/mapping';


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

        const conflictingPlaces: Array<ConflictingPlace> = [{target: result.getInputPlaces()[0], conflict: po.getInputPlaces()[0]}]

        while (conflictingPlaces.length > 0) {
            const problem = conflictingPlaces.shift()!;
            const followingEvent = problem.conflict.outgoingArcs[0]?.destination as Transition;
            if (followingEvent === undefined) {
                // the conflicting place has no following event => there is no conflict to resolve
                continue;
            }

            let folding: Mapping | undefined;
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

                for (const [targetId, conflictId] of folding.placeMapping.entries()) {
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

    private attemptEventFolding(following: Transition, folded: Transition): Mapping | undefined {
        const followingSubnet = this.extractTPTSubnet(following);
        const foldedSubnet = this.extractTPTSubnet(folded);
        return this._isomorphism.getIsomorphicPetriNetMapping(followingSubnet, foldedSubnet);
    }

    private extractTPTSubnet(start: Transition): PetriNet {
        const result = new PetriNet();
        const t = new Transition(start.label);
        result.addTransition(t);

        for (const out of start.outgoingArcs) {
            const outP = out.destination as Place;
            const p = new Place();
            p.id = outP.id;
            result.addPlace(p);
            result.addArc(t, p);
            for (const post of outP.outgoingArcs) {
                const postT = post.destination as Transition;
                const tt = new Transition(postT.label);
                result.addTransition(tt);
                result.addArc(p, tt);
            }
        }

        return result;
    }

    private addConflict(conflict: Place, target: Place, folded: PetriNet) {
        if (target.outgoingArcs.length === 0) {
            return;
        }

        const original = target.outgoingArcs[0].destination as Transition;
        const following = new Transition(original.label);
        folded.addTransition(following);
        folded.addArc(conflict, following);

        for (const out of original.outgoingArcs) {
            const p = new Place();
            folded.addPlace(p);
            folded.addArc(following, p);

            // TODO support merging flows
            this.addConflict(p, out.destination as Place, folded);
        }
    }
}
