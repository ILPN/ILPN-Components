import {Injectable} from '@angular/core';
import {PetriNet} from '../../../models/pn/model/petri-net';
import {MapSet} from '../../../utility/map-set';
import {MappingManager} from './classes/mapping-manager';

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

        const transitionMapping = this.determinePossibleTransitionMappings(partialOrderA, partialOrderB);
        if (transitionMapping === undefined) {
            return false;
        }

        const transitionMappingManager = new MappingManager(transitionMapping);

        let done = false;
        do {
            const mapping = transitionMappingManager.getCurrentMapping();
            const uniqueMapped = new Set<string>(mapping.values());

            if (uniqueMapped.size === mapping.size // ist the mapping a bijection?
                && this.isMappingAPartialOrderIsomorphism(partialOrderA, partialOrderB, mapping)) {
                return true;
            }

            done = transitionMappingManager.moveToNextMapping();
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

    private determinePossibleTransitionMappings(netA: PetriNet, netB: PetriNet): MapSet<string, string> | undefined {
        const transitionMapping = new MapSet<string, string>();
        for (const tA of netA.getTransitions()) {
            let wasMapped = false;
            for (const tB of netB.getTransitions()) {
                if (tA.label === tB.label
                    && tA.ingoingArcs.length === tB.ingoingArcs.length
                    && tA.outgoingArcs.length === tB.outgoingArcs.length) {
                    wasMapped = true;
                    transitionMapping.add(tA.getId(), tB.getId());
                }
            }
            if (!wasMapped) {
                return undefined;
            }
        }
        return transitionMapping;
    }

    private isMappingAPartialOrderIsomorphism(partialOrderA: PetriNet, partialOrderB: PetriNet, transitionMapping: Map<string, string>): boolean {
        const unmappedArcs = partialOrderB.getPlaces().filter(p => p.ingoingArcs.length !== 0 && p.outgoingArcs.length !== 0);

        for (const arc of partialOrderA.getPlaces()) {
            if (arc.ingoingArcs.length === 0 || arc.outgoingArcs.length === 0) {
                continue;
            }
            const preTransitionB = transitionMapping.get(arc.ingoingArcs[0].sourceId)!;
            const postTransitionB = transitionMapping.get(arc.outgoingArcs[0].destinationId);

            const fittingArcIndex = unmappedArcs.findIndex(unmapped => unmapped.ingoingArcs[0].sourceId === preTransitionB && unmapped.outgoingArcs[0].destinationId === postTransitionB);
            if (fittingArcIndex === -1) {
                return false;
            }
            unmappedArcs.splice(fittingArcIndex, 1);
        }

        return true;
    }
}
