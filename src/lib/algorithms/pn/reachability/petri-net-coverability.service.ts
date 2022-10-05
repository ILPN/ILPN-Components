import {Injectable} from '@angular/core';
import {PetriNet} from '../../../models/pn/model/petri-net';
import {CoverabilityTree} from './model/coverability-tree';
import {Marking} from '../../../models/pn/model/marking';

@Injectable({
    providedIn: 'root'
})
export class PetriNetCoverabilityService {

    constructor() {
    }

    public getCoverabilityTree(net: PetriNet): CoverabilityTree {
        const tree = new CoverabilityTree(net.getInitialMarking());
        const statesToExplore = [tree];

        whileLoop:
        while (statesToExplore.length !== 0) {
            const state = statesToExplore.shift()!;
            const ancestors = state.ancestors;

            for (const a of ancestors) {
                if (a.omegaMarking.equals(state.omegaMarking)) {
                    continue whileLoop;
                }
            }

            const enabledTransitions = PetriNet.getAllEnabledTransitions(net, state.omegaMarking);
            for (const t of enabledTransitions) {
                const nextMarking = PetriNet.fireTransitionInMarking(net, t.id!, state.omegaMarking);
                const nextOmegaMarking = this.computeNextOmegaMarking(nextMarking, ancestors);
                const newState = state.addChild(t.label!, nextOmegaMarking);
                statesToExplore.push(newState);
            }
        }

        return tree;
    }

    protected computeNextOmegaMarking(nextMarking: Marking, ancestors: Array<CoverabilityTree>): Marking {
        const runningOmega = new Marking(nextMarking);
        for (const a of ancestors) {
            runningOmega.introduceOmegas(a.omegaMarking);
        }
        return runningOmega;
    }
}
