import {Injectable} from '@angular/core';
import {PetriNet} from '../../../models/pn/model/petri-net';
import {MapSet} from '../../../utility/map-set';
import {MappingManager} from './classes/mapping-manager';
import {Transition} from '../../../models/pn/model/transition';

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

    public arePetriNetsIsomorphic(netA: PetriNet, netB: PetriNet): boolean {
        if (!this.compareBasicNetProperties(netA, netB)) {
            return false;
        }

        const transitionMapping = this.determinePossibleTransitionMappings(netA, netB);
        if (transitionMapping === undefined) {
            return false;
        }

        const placeMapping = this.determinePossiblePlaceMappings(netA, netB);
        if (placeMapping === undefined) {
            return false;
        }

        const transitionMappingManager = new MappingManager(transitionMapping);
        const placeMappingManager = new MappingManager(placeMapping);

        let done = false;
        do {
            const transitionMapping = transitionMappingManager.getCurrentMapping();
            const uniqueTransitionsMapped = new Set<string>(transitionMapping.values());
            if (transitionMapping.size === uniqueTransitionsMapped.size) { // bijective transition mapping
                const placeMapping = placeMappingManager.getCurrentMapping();
                const uniquePlacesMapped = new Set<string>(placeMapping.values());
                if (placeMapping.size === uniquePlacesMapped.size // bijective place mapping
                    && this.isMappingAPetriNetIsomorphism(netA, netB, transitionMapping, placeMapping)) {
                    return true;
                }
            }

            const carry = transitionMappingManager.moveToNextMapping();
            if (carry) {
                done = placeMappingManager.moveToNextMapping();
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

    private determinePossiblePlaceMappings(netA: PetriNet, netB: PetriNet): MapSet<string, string> | undefined {
        const placeMapping = new MapSet<string, string>();
        for (const pA of netA.getPlaces()) {
            let wasMapped = false;
            for (const pB of netB.getPlaces()) {
                if (pA.marking === pB.marking
                    && pA.ingoingArcs.length === pB.ingoingArcs.length
                    && pA.outgoingArcs.length === pB.outgoingArcs.length) {
                    wasMapped = true;
                    placeMapping.add(pA.getId(), pB.getId());
                }
            }
            if (!wasMapped) {
                return undefined;
            }
        }
        return placeMapping;
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

    private isMappingAPetriNetIsomorphism(netA: PetriNet, netB: PetriNet, transitionMapping: Map<string, string>, placeMapping: Map<string, string>): boolean {
        const unmappedArcs = netB.getArcs();

        for (const arc of netA.getArcs()) {
            let arcSourceId: string;
            let arcDestinationId: string;
            if (arc.source instanceof Transition) {
                arcSourceId = transitionMapping.get(arc.sourceId)!;
                arcDestinationId = placeMapping.get(arc.destinationId)!;
            } else {
                arcSourceId = placeMapping.get(arc.sourceId)!;
                arcDestinationId = transitionMapping.get(arc.destinationId)!;
            }

            // TODO arc weight is not considered when creating possible mappings. Inclusion of this property might make the algorithm more efficient
            const fittingArcIndex = unmappedArcs.findIndex(unmapped => unmapped.sourceId === arcSourceId && unmapped.destinationId === arcDestinationId && unmapped.weight === arc.weight);
            if (fittingArcIndex === -1) {
                return false;
            }
            unmappedArcs.splice(fittingArcIndex, 1);
        }

        return true;
    }
}
