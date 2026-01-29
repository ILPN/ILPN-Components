import {Injectable} from '@angular/core';
import {PetriNet} from '../../../models/pn/model/petri-net';
import {MapSet} from '../../../utility/map-set';
import {MappingManager} from './classes/mapping-manager';
import {Transition} from '../../../models/pn/model/transition';
import {
    PetriNetToPartialOrderTransformerService
} from '../transformation/petri-net-to-partial-order-transformer.service';
import {PartialOrderIsomorphismService} from '../../po/isomorphism/partial-order-isomorphism.service';
import {Mapping} from './classes/mapping';
import {Arc} from "../../../models/pn/model/arc";
import {Place} from "../../../models/pn/model/place";


@Injectable({
    providedIn: 'root'
})
export class PetriNetIsomorphismService {

    constructor(protected _pnToPoTransformer: PetriNetToPartialOrderTransformerService,
                protected _poIsomorphism: PartialOrderIsomorphismService) {
    }

    public arePartialOrderPetriNetsIsomorphic(partialOrderA: PetriNet, partialOrderB: PetriNet): boolean {
        if (!this.compareBasicNetProperties(partialOrderA, partialOrderB)) {
            return false;
        }

        return this._poIsomorphism.arePartialOrdersIsomorphic(
            this._pnToPoTransformer.transform(partialOrderA),
            this._pnToPoTransformer.transform(partialOrderB)
        );
    }

    public arePetriNetsIsomorphic(netA: PetriNet, netB: PetriNet): boolean {
        return !!this.getIsomorphicPetriNetMapping(netA, netB);
    }

    public getIsomorphicPetriNetMapping(netA: PetriNet, netB: PetriNet): Mapping | undefined {
        if (!this.compareBasicNetProperties(netA, netB)) {
            return undefined;
        }

        const transitionMapping = this.determinePossibleTransitionMappings(netA, netB);
        if (transitionMapping === undefined) {
            return undefined;
        }

        const placeMapping = this.determinePossiblePlaceMappings(netA, netB);
        if (placeMapping === undefined) {
            return undefined;
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
                    return {
                        placeMapping,
                        transitionMapping
                    };
                }
            }

            const carry = transitionMappingManager.moveToNextMapping();
            if (carry) {
                done = placeMappingManager.moveToNextMapping();
            }
        } while (!done);

        return undefined;
    }

    private compareBasicNetProperties(netA: PetriNet, netB: PetriNet): boolean {
        return netA.getTransitionCount() === netB.getTransitionCount()
            && netA.getPlaceCount() === netB.getPlaceCount()
            && netA.getArcCount() === netB.getArcCount()
            && netA.inputPlaces.size === netB.inputPlaces.size
            && netA.outputPlaces.size === netB.outputPlaces.size
            && this.compareLabelCounts(netA, netB);
    }

    private compareLabelCounts(netA: PetriNet, netB: PetriNet): boolean {
        const aCount = netA.getLabelCount();
        const bCount = netB.getLabelCount();
        if (aCount.size !== bCount.size) {
            return false;
        }
        for (let [l, c] of aCount.entries()) {
            if (bCount.get(l) !== c) {
                return false;
            }
        }
        return true;
    }

    private determinePossibleTransitionMappings(netA: PetriNet, netB: PetriNet): MapSet<string, string> | undefined {
        const transitionMapping = new MapSet<string, string>();
        for (const tA of netA.getTransitions()) {
            let wasMapped = false;
            for (const tB of netB.getTransitions()) {
                if (tA.label === tB.label && this.determineTransitionArcCompatibility(tA, tB)) {
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

    private determineTransitionArcCompatibility(tA: Transition, tB: Transition): boolean {
        if (tA.ingoingArcs.length !== tB.ingoingArcs.length
            || tA.outgoingArcs.length !== tB.outgoingArcs.length) {
            return false;
        }
        // we check to depth 1, what is the marking of the next place and what is the weight connecting us to it
        if (!this.areTwoLevelMultisetsEqual(
                this.aggregateTwoLevelMultiset(tA.ingoingArcs, (a) => (a.source as Place).marking),
                this.aggregateTwoLevelMultiset(tB.ingoingArcs, (a) => (a.source as Place).marking)
            )) {
            return false;
        }

        return this.areTwoLevelMultisetsEqual(
            this.aggregateTwoLevelMultiset(tA.outgoingArcs, (a) => (a.destination as Place).marking),
            this.aggregateTwoLevelMultiset(tB.outgoingArcs, (a) => (a.destination as Place).marking)
        );
    }

    private determinePossiblePlaceMappings(netA: PetriNet, netB: PetriNet): MapSet<string, string> | undefined {
        const placeMapping = new MapSet<string, string>();
        for (const pA of netA.getPlaces()) {
            let wasMapped = false;
            for (const pB of netB.getPlaces()) {
                if (pA.marking === pB.marking && this.determinePlaceArcCompatibility(pA, pB)) {
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

    private determinePlaceArcCompatibility(pA: Place, pB: Place): boolean {
        if (pA.ingoingArcs.length !== pB.ingoingArcs.length
            || pA.outgoingArcs.length !== pB.outgoingArcs.length) {
            return false;
        }
        // we check to depth 1, what is the label of the next transition and what is the weight connecting us to it
        if (!this.areTwoLevelMultisetsEqual(
            this.aggregateTwoLevelMultiset(pA.ingoingArcs, (a) => (a.source as Transition).label),
            this.aggregateTwoLevelMultiset(pB.ingoingArcs, (a) => (a.source as Transition).label)
        )) {
            return false;
        }

        return this.areTwoLevelMultisetsEqual(
            this.aggregateTwoLevelMultiset(pA.ingoingArcs, (a) => (a.destination as Transition).label),
            this.aggregateTwoLevelMultiset(pB.ingoingArcs, (a) => (a.destination as Transition).label)
        );
    }

    /**
     * @returns weight -> marking/label -> count
     */
    private aggregateTwoLevelMultiset<K>(arcs: Array<Arc>, getNextKey: (arc: Arc) => K): Map<number, Map<K, number>> {
        const result = new Map<number, Map<K, number>>();

        for (let a of arcs) {
            let inter = result.get(a.weight);
            if (inter === undefined) {
                inter = new Map<K, number>();
                result.set(a.weight, inter);
            }

            const nextKey = getNextKey(a);
            const count = inter.get(nextKey);
            if (count === undefined) {
                inter.set(nextKey, 1);
            } else {
                inter.set(nextKey, count + 1);
            }
        }

        return result;
    }

    private areTwoLevelMultisetsEqual<K>(a: Map<number, Map<K, number>>, b: Map<number, Map<K, number>>): boolean {
        if (a.size !== b.size) {
            return false;
        }

        for (let [k, am] of a.entries()) {
            const bm = b.get(k);
            if (bm === undefined) {
                return false;
            }
            if (am.size !== bm.size) {
                return false;
            }
            for (let [k2, av] of am.entries()) {
                if (av !== bm.get(k2)) {
                    return false;
                }
            }
        }

        return true;
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

            // we look at neighbourhood to depth 1 to narrow down possible candidates during their enumeration (weight and label/marking signatures)
            // there is definitely more room for improvements
            // for example, we currently do not propagate mapping choices to connected neighbours
            // TODO benchmark future improvements against tests disabled with 'xit'
            const fittingArcIndex = unmappedArcs.findIndex(unmapped => unmapped.sourceId === arcSourceId && unmapped.destinationId === arcDestinationId && unmapped.weight === arc.weight);
            if (fittingArcIndex === -1) {
                return false;
            }
            unmappedArcs.splice(fittingArcIndex, 1);
        }

        return true;
    }
}
