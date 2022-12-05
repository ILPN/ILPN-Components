import {Injectable} from '@angular/core';
import {PetriNet} from '../../../models/pn/model/petri-net';
import {Place} from '../../../models/pn/model/place';
import {Transition} from '../../../models/pn/model/transition';
import {Arc} from '../../../models/pn/model/arc';


interface ConflictingPlace {
    target: Place;
    conflict: Place;
}

@Injectable({
    providedIn: 'root'
})
export class BranchingProcessFoldingService {

    constructor() {
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

            let matchingContinuation: Transition | undefined;
            for (const a of problem.target.outgoingArcs) {

            }

        }

        return result;
    }

    private isMatchingContinuation(arc: Arc, followingEvent: Transition): Map<string, string> | undefined {

    }
}
