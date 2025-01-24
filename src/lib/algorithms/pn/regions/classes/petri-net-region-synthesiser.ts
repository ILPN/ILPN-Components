import {PetriNet} from '../../../../models/pn/model/petri-net';
import {Transition} from '../../../../models/pn/model/transition';
import {Place} from '../../../../models/pn/model/place';
import {PetriNetRegion} from './petri-net-region';
import {SynthesisConfiguration} from "./synthesis-configuration";
import {Flow} from "./flow";
import {MultisetMap} from "../../../../utility/multiset/multiset-map";
import {NoopMultisetEquivalent} from "../../../../utility/multiset/noop-multiset-equivalent";
import {Multiset} from "../../../../utility/multiset/multiset";


export class PetriNetRegionSynthesiser {

    private _regions: Array<PetriNetRegion> = [];

    constructor() {
    }

    public addRegion(region: PetriNetRegion) {
        this._regions.push(region);
    }

    public synthesise(config: SynthesisConfiguration = {}): PetriNet {
        if (this._regions.length === 0) {
            throw new Error(`You must provide regions via the 'addRegion' method before you can run the synthesis!`);
        }

        const uniqueTransitionLabels = new Set<string>(this._regions[0].rises.keys());

        // extract transitions from regions
        const result = new PetriNet();
        for (const label of uniqueTransitionLabels) {
            result.addTransition(this.transition(label));
        }

        const placeMap = new MultisetMap<NoopMultisetEquivalent>()

        // extract places and arcs from regions
        for (const region of this._regions) {
            const place = new Place();

            // extract initial marking
            if (region.indexWithInitialStates !== undefined) {
                const nm = region.netAndMarking[region.indexWithInitialStates];
                place.marking = nm.net.getPlaces().filter(p => p.marking > 0).reduce((acc, p) => acc + p.marking * nm.marking.get(p.getId())!, 0);
            }

            const encoded = this.convertToMultiset(region.rises, config);

            if (placeMap.get(encoded.multiset)) {
                // equivalent place is already in the net
                continue;
            }
            placeMap.put(encoded);

            result.addPlace(place);
            for (const [label, rise] of region.rises) {
                this.addArc(label, place, rise, result, config);
            }
        }

        return result;
    }

    private transition(label: string): Transition {
        return new Transition(label, label);
    }

    private convertToMultiset(rises: Map<string, Flow>, config: SynthesisConfiguration): NoopMultisetEquivalent {
        const riseMultiset: Multiset = {};

        for (const [label, rise] of rises) {
            if (config.noShortLoops) {
                riseMultiset[label] = rise.outflow - rise.inflow;
            } else {
                riseMultiset[`in_${label}`] = rise.inflow;
                riseMultiset[`out_${label}`] = rise.outflow;
            }
        }

        return new NoopMultisetEquivalent(riseMultiset);
    }

    private addArc(label: string, place: Place, rise: Flow, net: PetriNet, config: SynthesisConfiguration) {
        const transition = <Transition>net.getTransition(label);

        if (config.noShortLoops) {
            const gradient = rise.outflow - rise.inflow;

            if (gradient === 0) {
                return;
            }

            if (gradient > 0) {
                net.addArc(transition, place, gradient);
            } else {
                net.addArc(place, transition, -gradient);
            }
        } else {
            if (rise.inflow > 0) {
                net.addArc(place, transition, rise.inflow);
            }
            if (rise.outflow > 0) {
                net.addArc(transition, place, rise.outflow);
            }
        }
    }
}
