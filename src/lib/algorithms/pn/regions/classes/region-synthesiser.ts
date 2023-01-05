import {PetriNet} from '../../../../models/pn/model/petri-net';
import {IncrementingCounter} from '../../../../utility/incrementing-counter';
import {Transition} from '../../../../models/pn/model/transition';
import {Place} from '../../../../models/pn/model/place';
import {Region} from './region';

export class RegionSynthesiser {

    private _regions: Array<Region> = [];

    constructor() {
    }

    public addRegion(region: Region) {
        this._regions.push(region);
    }

    public synthesise(): PetriNet {
        if (this._regions.length === 0) {
            throw new Error(`You must provide regions via the 'addRegion' method before you can run the synthesis!`);
        }

        const region = this._regions[0].net;
        const uniqueTransitionLabels = new Set<string>();
        for (const t of region.getTransitions()) {
            const label = t.label;
            if (label === undefined) {
                throw new Error('All transitions in Petri net regions must be labeled!');
            }
            uniqueTransitionLabels.add(label);
        }

        // extract transitions from regions
        const result = new PetriNet();
        for (const label of uniqueTransitionLabels) {
            result.addTransition(this.transition(label));
        }

        // extract places and arcs from regions
        for (const region of this._regions) {
            const place = new Place(region.inputs.reduce((sum, id) => sum + region.net.getPlace(id)!.marking, 0))

            const gradients = new Map<string, number>();
            for (const t of region.net.getTransitions()) {
                const gradient = this.computeGradient(t);
                const label = <string>t.label;
                const existingGradient = gradients.get(label);
                if (existingGradient !== undefined && gradient !== existingGradient) {
                    console.debug(region);
                    throw new Error(`The provided Petri net is not a valid region! The gradient of label '${label}' of transition with id '${t.id}' is ${gradient}, but a different transition with the same label has a gradient of ${existingGradient}!`);
                } else {
                    gradients.set(<string>t.label, gradient);
                }
            }

            if (!this.isEquivalentPlaceInNet(gradients, result)) {
                result.addPlace(place);
                for (const [label, gradient] of gradients) {
                    this.addArc(label, place, gradient, result);
                }
            }
        }

        return result;
    }

    private transition(label: string): Transition {
        return new Transition(label, label);
    }

    private computeGradient(transition: Transition): number {
        let gradient = 0;
        for (const a of transition.outgoingArcs) {
            gradient += (a.destination as Place).marking;
        }
        for (const a of transition.ingoingArcs) {
            gradient -= (a.source as Place).marking;
        }
        return gradient;
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
    private isEquivalentPlaceInNet(gradients: Map<string, number>, net: PetriNet): boolean {
        if (net.getPlaces().length === 0) {
            return false;
        }
        return net.getPlaces().some(existingPlace => {
            for (const [label, gradient] of gradients) {
                if (gradient === 0) {
                    continue;
                }
                if (gradient < 0) {
                    if ((existingPlace as Place).outgoingArcWeights.get(label) !== -gradient) {
                        return false;
                    }
                } else if ((existingPlace as Place).ingoingArcWeights.get(label) !== gradient) {
                    return false;
                }
            }
            return true;
        });
    }

}
