import {Injectable} from '@angular/core';
import {Trace} from '../../models/log/model/trace';
import {ConcurrencyRelation} from '../../models/concurrency/model/concurrency-relation';
import {PetriNet} from '../../models/pn/model/petri-net';
import {PrefixTree} from '../../utility/prefix-graphs/prefix-tree';
import {PetriNetSequence} from './concurrency-oracle/alpha-oracle/petri-net-sequence';
import {LogCleaner} from './log-cleaner';
import {Place} from '../../models/pn/model/place';
import {Transition} from '../../models/pn/model/transition';
import {MapSet} from '../../utility/map-set';
import {EditableStringSequenceWrapper} from '../../utility/string-sequence';
import {PetriNetIsomorphismService} from '../pn/isomorphism/petri-net-isomorphism.service';
import {PartialOrderNetWithContainedTraces} from '../../models/pn/model/partial-order-net-with-contained-traces';
import {LogEvent} from '../../models/log/model/logEvent';


export interface LogToPartialOrderTransformerConfiguration {
    cleanLog?: boolean;
    addStartStopEvent?: boolean;
    discardPrefixes?: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class LogToPartialOrderTransformerService extends LogCleaner {

    public static readonly START_SYMBOL = '▶';
    public static readonly STOP_SYMBOL = '■';

    constructor(protected _pnIsomorphismService: PetriNetIsomorphismService) {
        super();
    }

    public transformToPartialOrders(log: Array<Trace>, concurrencyRelation: ConcurrencyRelation, config: LogToPartialOrderTransformerConfiguration = {}): Array<PartialOrderNetWithContainedTraces> {
        if (log.length === 0) {
            return [];
        }

        if (!!config.cleanLog) {
            log = this.cleanLog(log);
        } else {
            console.warn(`relabeling a log with both 'start' and 'complete' events will result in unexpected label associations!`);
        }

        concurrencyRelation.relabeler.relabelSequencesPreserveNonUniqueIdentities(log);

        const sequences = this.convertLogToPetriNetSequences(log, !!config.discardPrefixes);

        // transitive reduction requires all places to be internal => always add start/stop and remove later
        sequences.forEach(seq => {
            this.addStartAndStopEvent(seq);
        });
        const partialOrders = this.convertSequencesToPartialOrders(sequences, concurrencyRelation);
        this.removeTransitiveDependencies(partialOrders);
        if (!config.addStartStopEvent) {
            partialOrders.forEach(po => {
                this.removeStartAndStopEvent(po);
            });
        }
        const result = this.filterAndCombinePartialOrderNets(partialOrders);

        concurrencyRelation.relabeler.undoSequencesLabeling(result.map(po => new EditableStringSequenceWrapper(po.net.getTransitions())));

        return result;
    }

    private convertLogToPetriNetSequences(log: Array<Trace>, discardPrefixes: boolean): Array<PetriNetSequence> {
        const netSequences = new Set<PetriNetSequence>();
        const tree = new PrefixTree<PetriNetSequence>(new PetriNetSequence());

        for (const trace of log) {
            tree.insert(trace,
                () => {
                    throw new Error('should never be called');
                },
                (node, treeNode) => {
                    if (discardPrefixes && treeNode.hasChildren()) {
                        node.net.frequency = 0;
                        netSequences.delete(node);
                    } else {
                        node.net.frequency = node.net.frequency === undefined ? 1 : node.net.frequency + 1;
                        netSequences.add(node);
                    }
                },
                discardPrefixes ? (s, node, treeNode) => {
                    if (treeNode.hasChildren()) {
                        node!.net.frequency = 0;
                        netSequences.delete(node!);
                    }
                } : undefined,
                (step, prefix, previousNode) => {
                    const newNode = previousNode!.clone();
                    newNode.appendEvent(step);
                    return newNode;
                }
            );
        }

        return Array.from(netSequences);
    }

    private addStartAndStopEvent(sequence: PetriNetSequence) {
        // add events to net
        const sequenceNet = sequence.net;
        const firstLast = sequenceNet.getPlaces().filter(p => p.ingoingArcs.length === 0 || p.outgoingArcs.length === 0);
        if (firstLast.length !== 2) {
            console.debug(sequenceNet);
            throw new Error('Illegal state. A sequence must have one start and one end place.');
        }
        let first, last: Place;
        if (firstLast[0].ingoingArcs.length === 0) {
            first = firstLast[0];
            last = firstLast[1];
        } else {
            first = firstLast[1];
            last = firstLast[0];
        }

        const preStart = new Place();
        const start = new Transition(LogToPartialOrderTransformerService.START_SYMBOL);
        sequenceNet.addPlace(preStart);
        sequenceNet.addTransition(start);
        sequenceNet.addArc(preStart, start);
        sequenceNet.addArc(start, first);

        const stop = new Transition(LogToPartialOrderTransformerService.STOP_SYMBOL);
        const postStop = new Place();
        sequenceNet.addTransition(stop);
        sequenceNet.addPlace(postStop);
        sequenceNet.addArc(last, stop);
        sequenceNet.addArc(stop, postStop);

        // add events to trace
        sequence.trace.events.unshift(new LogEvent(LogToPartialOrderTransformerService.START_SYMBOL));
        sequence.trace.events.push(new LogEvent(LogToPartialOrderTransformerService.STOP_SYMBOL));
    }

    private removeStartAndStopEvent(partialOrder: PartialOrderNetWithContainedTraces) {
        // remove from net
        const partialOrderNet = partialOrder.net;
        if (partialOrderNet.inputPlaces.size !== 1 || partialOrderNet.outputPlaces.size !== 1) {
            console.debug(partialOrderNet);
            throw new Error('illegal state');
        }

        let startTransition: Transition | undefined = undefined;
        partialOrderNet.inputPlaces.forEach(id => {
            const inPlace = partialOrderNet.getPlace(id)!;
            startTransition = inPlace.outgoingArcs[0].destination as Transition;
            partialOrderNet.removePlace(id);
        });

        if (startTransition === undefined || (startTransition as Transition).label !== LogToPartialOrderTransformerService.START_SYMBOL) {
            throw new Error('illegal state');
        }
        partialOrderNet.removeTransition(startTransition);

        let stopTransition: Transition | undefined = undefined;
        partialOrderNet.outputPlaces.forEach(id => {
            const outPlace = partialOrderNet.getPlace(id)!;
            stopTransition = outPlace.ingoingArcs[0].source as Transition;
            partialOrderNet.removePlace(id);
        });

        if (stopTransition === undefined || (stopTransition as Transition).label !== LogToPartialOrderTransformerService.STOP_SYMBOL) {
            throw new Error('illegal state');
        }
        partialOrderNet.removeTransition(stopTransition);

        // remove from trace
        partialOrder.containedTraces[0].events.shift();
        partialOrder.containedTraces[0].events.pop();
    }

    private convertSequencesToPartialOrders(sequences: Array<PetriNetSequence>, concurrencyRelation: ConcurrencyRelation): Array<PartialOrderNetWithContainedTraces> {
        return sequences.map(seq => this.convertSequenceToPartialOrder(seq, concurrencyRelation));
    }

    private convertSequenceToPartialOrder(sequence: PetriNetSequence, concurrencyRelation: ConcurrencyRelation): PartialOrderNetWithContainedTraces {
        const net = sequence.net;
        const placeQueue = net.getPlaces();

        while (placeQueue.length > 0) {
            const place = placeQueue.shift() as Place;
            if (place.ingoingArcs.length === 0 || place.outgoingArcs.length === 0) {
                continue;
            }
            if (place.ingoingArcs.length > 1 || place.outgoingArcs.length > 1) {
                console.debug(place);
                console.debug(sequence);
                throw new Error('Illegal state. The processed net is not a partial order!');
            }

            const preEvent = (place.ingoingArcs[0].source as Transition);
            const postEvent = (place.outgoingArcs[0].destination as Transition);
            if (
                preEvent.label! === postEvent.label!                           // no auto-concurrency
                || !concurrencyRelation.isConcurrent(preEvent.label!, postEvent.label!)
                || !concurrencyRelation.isConcurrent(postEvent.label!, preEvent.label!)
            ) {
                continue;
            }

            net.removePlace(place);

            for (const a of preEvent.ingoingArcs) {
                const inPlace = a.source as Place;

                if (inPlace.ingoingArcs.length === 0 && postEvent.ingoingArcs.some(a => a.source.ingoingArcs.length === 0)) {
                    continue;
                }
                if (inPlace.ingoingArcs.length > 0) {
                    const inTransId = inPlace.ingoingArcs[0].sourceId;
                    if (postEvent.ingoingArcs.some(a => a.source.ingoingArcs[0]?.sourceId === inTransId)) {
                        continue;
                    }
                }

                const clone = new Place();
                net.addPlace(clone);
                placeQueue.push(clone);

                if (inPlace.ingoingArcs.length > 0) {
                    net.addArc(inPlace.ingoingArcs[0].source as Transition, clone);
                }

                net.addArc(clone, postEvent)
            }

            for (const a of postEvent.outgoingArcs) {
                const outPlace = a.destination as Place;

                if (outPlace.outgoingArcs.length === 0 && preEvent.outgoingArcs.some(a => a.destination.outgoingArcs.length === 0)) {
                    continue;
                }
                if (outPlace.outgoingArcs.length > 0) {
                    const outTransId = outPlace.outgoingArcs[0].destinationId;
                    if (preEvent.outgoingArcs.some(a => a.destination.outgoingArcs[0]?.destinationId === outTransId)) {
                        continue;
                    }
                }

                const clone = new Place();
                net.addPlace(clone);
                placeQueue.push(clone);

                if (outPlace.outgoingArcs.length > 0) {
                    net.addArc(clone, outPlace.outgoingArcs[0].destination as Transition);
                }

                net.addArc(preEvent, clone)
            }
        }

        return new PartialOrderNetWithContainedTraces(net, [sequence.trace]);
    }

    private removeTransitiveDependencies(pos: Array<PartialOrderNetWithContainedTraces>) {
        pos.forEach(po => this.performTransitiveReduction(po.net));
    }

    private performTransitiveReduction(partialOrder: PetriNet) {
        // algorithm based on "Algorithm A" from https://www.sciencedirect.com/science/article/pii/0304397588900321
        // the paper itself offers an improvement over this Algorithm - might be useful if A proves to be too slow

        const reverseTransitionOrder = this.reverseTopologicalTransitionOrdering(partialOrder);

        const reverseOrder = new Map<string, number>(reverseTransitionOrder.map((t, i) => [t.getId(), i]));
        const transitiveDescendants = new MapSet<string, string>();
        const reducedDescendants = new MapSet<string, string>();

        for (const t of reverseTransitionOrder) {
            transitiveDescendants.add(t.getId(), t.getId());
            const childrenIds = this.getChildIds(t).sort((id1, id2) => reverseOrder.get(id2)! - reverseOrder.get(id1)!);
            for (const childId of childrenIds) {
                if (!transitiveDescendants.has(t.getId(), childId)) {
                    transitiveDescendants.addAll(t.getId(), transitiveDescendants.get(childId));
                    reducedDescendants.add(t.getId(), childId);
                }
            }
        }

        // remove transitive connections (places)
        for (const t of partialOrder.getTransitions()) {
            if (t.label === LogToPartialOrderTransformerService.STOP_SYMBOL) {
                continue;
            }
            for (const a of t.outgoingArcs) {
                if (!reducedDescendants.has(t.getId(), a.destination.outgoingArcs[0].destinationId)) {
                    partialOrder.removePlace(a.destinationId);
                }
            }
        }
    }

    private getChildIds(transition: Transition): Array<string> {
        return transition.outgoingArcs.flatMap(a => a.destination.outgoingArcs.map(ta => ta.destination.getId()));
    }

    /**
     * Returns an array containing the transitions of the given net. The result is in reverse-topological order i.e.
     * transitions at the front of the Array appear later in the net.
     *
     * Implementation based on https://www.geeksforgeeks.org/topological-sorting/3
     * @param net a Petri Net representation of a partial order
     */
    private reverseTopologicalTransitionOrdering(net: PetriNet): Array<Transition> {
        const resultStack: Array<Transition> = [];
        const visited = new Set<string>();
        for (const t of net.getTransitions()) {
            if (visited.has(t.getId())) {
                continue;
            }
            this.topologicalOrderingUtil(t, visited, resultStack);
        }
        return resultStack;
    }

    private topologicalOrderingUtil(t: Transition, visited: Set<string>, resultStack: Array<Transition>) {
        visited.add(t.getId());
        for (const a of t.outgoingArcs) {
            const nextTransition = a.destination.outgoingArcs[0]?.destination;
            if (nextTransition === undefined) {
                continue;
            }
            if (visited.has(nextTransition.getId())) {
                continue;
            }
            this.topologicalOrderingUtil(nextTransition as Transition, visited, resultStack);
        }
        resultStack.push(t);
    }

    private filterAndCombinePartialOrderNets(partialOrders: Array<PartialOrderNetWithContainedTraces>): Array<PartialOrderNetWithContainedTraces> {
        const unique: Array<PartialOrderNetWithContainedTraces> = [partialOrders.shift()!];

        for (const uncheckedOrder of partialOrders) {
            let discard = false;
            for (const uniqueOrder of unique) {
                if (this._pnIsomorphismService.arePartialOrderPetriNetsIsomorphic(uncheckedOrder.net, uniqueOrder.net)) {
                    discard = true;
                    uniqueOrder.net.frequency = uniqueOrder.net.frequency! + uncheckedOrder.net.frequency!;
                    uniqueOrder.containedTraces.push(...uncheckedOrder.containedTraces);
                    break;
                }
            }
            if (!discard) {
                unique.push(uncheckedOrder);
            }
        }

        return unique;
    }

}
