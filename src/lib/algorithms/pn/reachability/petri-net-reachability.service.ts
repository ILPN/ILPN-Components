import {Injectable} from '@angular/core';
import {PetriNet} from "../../../models/pn/model/petri-net";
import {Trace} from "../../../models/log/model/trace";
import {Marking} from "../../../models/pn/model/marking";

@Injectable({
    providedIn: 'root'
})
export class PetriNetReachabilityService {

    constructor() {
    }

    public getMarkingsReachableByTraces(net: PetriNet, traces: Array<Trace>): Array<Marking> {
        const reachableMarkings = [net.getInitialMarking()];
        const placeOrdering = net.getPlaces().map(p => p.getId());

        const reachedMarkings = new Map<string, number>();
        reachedMarkings.set(reachableMarkings[0].serialise(placeOrdering), 0);

        const reachabilityGraph = new Map<number, Map<string, number>>();

        const labelToId = new Map<string, string>();
        for (const trans of net.getTransitions()) {
            if (labelToId.has(trans.label!)) {
                throw new Error('this method does not support labeled nets!');
            }
            labelToId.set(trans.label!, trans.getId());
        }

        for (const t of traces) {
            let currentState = 0;

            for (const l of t.eventNames) {
                const nextState = reachabilityGraph.get(currentState)?.get(l);
                if (nextState !== undefined) {
                    currentState = nextState;
                    continue;
                }

                const tid = labelToId.get(l);
                if (tid === undefined) {
                    throw new Error(`The given net does not have a transition with the label '${l}'`);
                }

                const newMarking = PetriNet.fireTransitionInMarking(net, tid,reachableMarkings[currentState]);

                const markingKey = newMarking.serialise(placeOrdering);
                let newMarkingIndex = reachedMarkings.get(markingKey);
                if (newMarkingIndex === undefined) {
                    newMarkingIndex = reachableMarkings.length;
                    reachableMarkings.push(newMarking);
                    reachedMarkings.set(markingKey, newMarkingIndex);
                }

                let currentMarkingMap = reachabilityGraph.get(currentState);
                if (currentMarkingMap === undefined) {
                    currentMarkingMap = new Map<string, number>();
                    reachabilityGraph.set(currentState, currentMarkingMap);
                }

                if (currentMarkingMap.has(l)) {
                    throw new Error('Sanity check. Impossible state');
                }
                currentMarkingMap.set(l, newMarkingIndex);

                currentState = newMarkingIndex;
            }
        }

        return reachableMarkings;
    }

}
