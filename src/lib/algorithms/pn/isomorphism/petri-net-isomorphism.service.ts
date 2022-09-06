import {Injectable} from '@angular/core';
import {PetriNet} from '../../../models/pn/model/petri-net';
import {MapSet} from '../../../utility/map-set';
import {PossibleMapping} from './classes/possible-mapping';

@Injectable({
    providedIn: 'root'
})
export class PetriNetIsomorphismService {

    constructor() {
    }

    public arePartialOrderPetriNetsIsomorphic(partialOrderA: PetriNet, partialOrderB: PetriNet): boolean {
        if (!this.compareBasicNetProperties(partialOrderA, partialOrderB)) {
            return false;
        }

        const transitionMapping = new MapSet<string, string>();
        for (const tA of partialOrderA.getTransitions()) {
            let wasMapped = false;
            for (const tB of partialOrderB.getTransitions()) {
                if (tA.label === tB.label) {
                    wasMapped = true;
                    transitionMapping.add(tA.getId(), tB.getId());
                }
            }
            if (!wasMapped) {
                return false;
            }
        }

        const choiceOrder: Array<PossibleMapping> = [];
        for (const [transitionId, possibleTransitionIds] of transitionMapping.entries()) {
            choiceOrder.push(new PossibleMapping(transitionId, possibleTransitionIds.size))
        }

        const orderedTransitionMapping = new Map<string, Array<string>>(choiceOrder.map(choice => [choice.transitionId, Array.from(transitionMapping.get(choice.transitionId))]));

        let done = false;
        do {
            const mapping = new Map<string, string>(choiceOrder.map(choice => [choice.transitionId, orderedTransitionMapping.get(choice.transitionId)![choice.current()]]));
            const uniqueMapped = new Set<string>(mapping.values()); // ist the mapping a bijection?

            if (uniqueMapped.size === mapping.size && this.isMappingAnIsomorphism(partialOrderA, partialOrderB, mapping)) {
                return true;
            }

            let incrementedIndex = 0;
            while (incrementedIndex < choiceOrder.length) {
                const carry = choiceOrder[incrementedIndex].isLastOption();
                choiceOrder[incrementedIndex].next();
                if (carry) {
                    incrementedIndex++;
                } else {
                    break;
                }
            }
            if (incrementedIndex === choiceOrder.length) {
                done = true;
            }
        } while (!done);

        return false;
    }

    private compareBasicNetProperties(netA: PetriNet, netB: PetriNet): boolean {
        return netA.getTransitionCount() === netB.getTransitionCount()
            && netA.getPlaceCount() === netB.getPlaceCount()
            && netA.getArcCount() === netB.getArcCount()
            && netA.inputPlaces.size === netB.inputPlaces.size
            && netA.outputPlaces.size === netB.outputPlaces.size;
    }

    private isMappingAnIsomorphism(partialOrderA: PetriNet, partialOrderB: PetriNet, mapping: Map<string, string>): boolean {
        const unmappedArcs = partialOrderB.getPlaces().filter(p => p.ingoingArcs.length !== 0 && p.outgoingArcs.length !== 0);

        for (const arc of partialOrderA.getPlaces()) {
            if (arc.ingoingArcs.length === 0 || arc.outgoingArcs.length === 0) {
                continue;
            }
            const preTransitionB = mapping.get(arc.ingoingArcs[0].sourceId)!;
            const postTransitionB = mapping.get(arc.outgoingArcs[0].destinationId);

            const fittingArcIndex = unmappedArcs.findIndex(unmapped => unmapped.ingoingArcs[0].sourceId === preTransitionB && unmapped.outgoingArcs[0].destinationId === postTransitionB);
            if (fittingArcIndex === -1) {
                return false;
            }
            unmappedArcs.splice(fittingArcIndex, 1);
        }

        return true;
    }
}
