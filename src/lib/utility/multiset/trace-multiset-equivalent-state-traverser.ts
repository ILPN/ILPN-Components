import {Trace} from '../../models/log/model/trace';
import {Multiset} from './multiset';
import {MultisetEquivalentTraces} from './multiset-equivalent-traces';
import {PrefixMultisetStateGraph} from '../prefix-graphs/prefix-multiset-state-graph';
import {cleanTrace} from '../../algorithms/log/clean-log';


export class TraceMultisetEquivalentStateTraverser {

    /**
     * Traverses the state diagram defined by the list of traces.
     * Where each state is represented by the multiset of events contained in the prefix closure of each trace.
     *
     * Whenever a state is reached for the first time the `newEdgeReaction` method is called,
     * with the previous state as well as the event that caused the transition as arguments.
     *
     * @param traces a list of traces - an event log
     * @param newEdgeReaction a method that is called whenever a new state is reached
     * @returns a list of all final states. Each state contains the traces that terminate in it.
     */
    public traverseMultisetEquivalentStates(traces: Array<Trace>,
                                            newEdgeReaction: (prefix: Multiset, step: string) => void = () => {
                                           }): Array<MultisetEquivalentTraces> {
        const multisetStateGraph = new PrefixMultisetStateGraph<MultisetEquivalentTraces>(new MultisetEquivalentTraces({}));

        for (const t of traces) {
            const trace = cleanTrace(t);

            multisetStateGraph.insert(trace,
                (_, newState) => {
                    return new MultisetEquivalentTraces(newState);
                },
                (step, previousNode) => {
                    newEdgeReaction(previousNode.multiset, step);
                }, node => {
                    node.addTrace(trace);
                }
            );
        }

        return multisetStateGraph.getGraphStates().filter(s => s.count > 0);
    }
}
