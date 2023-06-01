import {Trace} from "../../models/log/model/trace";
import {PrefixTree} from "../../utility/prefix-graphs/prefix-tree";


/**
 * @param log traces to be filtered. The method does not modify the trace content, but changes the `frequency` attribute of some or all of the traces.
 * @param discardPrefixes if set to `true`, the output array will not contain any unique traces that are prefixes of some other trace. Frequencies of filtered traces are not part of the output.
 * @returns an array containing only the unique input traces. The `frequency` attribute of the traces in the array is set to the number of traces from the input array that match the given trace.
 */
export function filterUniqueTraces(log: Array<Trace>, discardPrefixes = false): Array<Trace> {
    const uniqueTraces = new Set<Trace>();
    const tree = new PrefixTree<Trace>();

    for (const trace of log) {
        tree.insert(trace,
            treeNode => {
                if (discardPrefixes && treeNode.hasChildren()) {
                    return undefined;
                }
                trace.frequency = 1;
                uniqueTraces.add(trace);
                return trace;
            },
            (node, treeNode) => {
                if (!discardPrefixes || !treeNode.hasChildren()) {
                    node.frequency = node.frequency === undefined ? 1 : node.frequency + 1;
                }
            }, (label, previousNode) => {
                if (discardPrefixes && previousNode !== undefined) {
                    uniqueTraces.delete(previousNode);
                }
            }
        );
    }

    return Array.from(uniqueTraces);
}
