import {PetriNet} from '../../../../models/pn/model/petri-net';
import {Transition} from '../../../../models/pn/model/transition';
import {Place} from '../../../../models/pn/model/place';
import {PetriNetRegion} from './petri-net-region';

export class PetriNetRegionSynthesiser {

    private _regions: Array<PetriNetRegion> = [];

    constructor() {
    }

    public addRegion(region: PetriNetRegion) {
        this._regions.push(region);
    }

    public synthesise(): PetriNet {
        if (this._regions.length === 0) {
            throw new Error(`You must provide regions via the 'addRegion' method before you can run the synthesis!`);
        }

        const uniqueTransitionLabels = new Set<string>(this._regions[0].rises.keys());

        // extract transitions from regions
        const result = new PetriNet();
        for (const label of uniqueTransitionLabels) {
            result.addTransition(this.transition(label));
        }

        // extract places and arcs from regions
        for (const region of this._regions) {
            const place = new Place();

            // extract initial marking
            if (region.indexWithInitialStates !== undefined) {
                const nm = region.netAndMarking[region.indexWithInitialStates];
                place.marking = nm.net.getPlaces().filter(p => p.marking > 0).reduce((acc, p) => acc + p.marking * nm.marking.get(p.getId())!,0);
            }

            if (!this.isEquivalentPlaceInNet(region.rises, result)) {
                result.addPlace(place);
                for (const [label, rise] of region.rises) {
                    this.addArc(label, place, rise, result);
                }
            }
        }

        return result;
    }

    private transition(label: string): Transition {
        return new Transition(label, label);
    }

    private addArc(label: string, place: Place, gradient: number, net: PetriNet) {
        if (gradient === 0) {
            return;
        }

        const transition = <Transition>net.getTransition(label);

        if (gradient > 0) {
            net.addArc(transition, place, gradient);
        } else {
            net.addArc(place, transition, -gradient);
        }
    }

    // TODO improve this
    private isEquivalentPlaceInNet(rises: Map<string, number>, net: PetriNet): boolean {
        if (net.getPlaces().length === 0) {
            return false;
        }
        return net.getPlaces().some(existingPlace => {
            for (const [label, rise] of rises) {
                if (rise === 0) {
                    continue;
                }
                if (rise < 0) {
                    if ((existingPlace as Place).outgoingArcWeights.get(label) !== -rise) {
                        return false;
                    }
                } else if ((existingPlace as Place).ingoingArcWeights.get(label) !== rise) {
                    return false;
                }
            }
            return true;
        });
    }

}
