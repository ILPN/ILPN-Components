import {Injectable} from '@angular/core';
import {Trace} from '../../models/log/model/trace';
import {ConcurrencyRelation} from '../../models/concurrency/model/concurrency-relation';
import {MapSet} from '../../utility/map-set';
import {EditableStringSequenceWrapper} from '../../utility/string-sequence';
import {cleanLog} from './clean-log';
import {LogSymbol} from './log-symbol';
import {filterUniqueTraces} from "./unique-traces";
import {PartialOrder} from "../../models/po/model/partial-order";
import {Event} from "../../models/po/model/event";
import {iterateMap} from "../../utility/iterate";
import {PartialOrderIsomorphismService} from "../po/isomorphism/partial-order-isomorphism.service";



export interface LogToPartialOrderTransformerConfiguration {
    cleanLog?: boolean;
    addStartStopEvent?: boolean;
    discardPrefixes?: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class LogToPartialOrderTransformerService {

    constructor(protected _poIsomorphismService: PartialOrderIsomorphismService) {
    }

    public transformToPartialOrders(log: Array<Trace>, concurrencyRelation: ConcurrencyRelation, config: LogToPartialOrderTransformerConfiguration = {}): Array<PartialOrder> {
        if (log.length === 0) {
            return [];
        }


        if (!!config.cleanLog) {
            log = cleanLog(log);
        } else {
            console.warn(`relabeling a log with both 'start' and 'complete' events will result in unexpected label associations!`);
        }

        concurrencyRelation.relabeler.relabelSequencesPreserveNonUniqueIdentities(log);

        const unique = filterUniqueTraces(log, !!config.discardPrefixes);

        const partialOrders = this.convertTracesToPartialOrders(unique, concurrencyRelation);

        const result = this.filterAndCombinePartialOrders(partialOrders);

        if (config.addStartStopEvent) {
            partialOrders.forEach(po => {
                this.addStartAndStopEvent(po);
            });
        }

        concurrencyRelation.relabeler.undoSequencesLabeling(result.map(po => new EditableStringSequenceWrapper(po.events)));

        return result;
    }

    private convertTracesToPartialOrders(traces: Array<Trace>, concurrencyRelation: ConcurrencyRelation): Array<PartialOrder> {
        return traces.map((seq, i) => {
            const po = this.constructTransitiveClosure(seq, concurrencyRelation, i);
            this.performTransitiveReduction(po);
            return po;
        });
    }

    private constructTransitiveClosure(trace: Trace, concurrencyRelation: ConcurrencyRelation, i: number): PartialOrder {
        // construct the transitive closure by iterating over the trace backwards and adding arcs to all previous events,
        // except for those that are marked as concurrent by the oracle

        const po = new PartialOrder();

        const transitions: Array<Event> = trace.events.map((e, i) => {
            const t = new Event(`${i}`, e.name)
            po.addEvent(t);
            return t;
        });

        for(let suc = trace.length() - 1; suc > 0; suc--) {
            for (let pred = suc - 1; pred >= 0; pred--) {
                const first = transitions[pred];
                const second = transitions[suc];
                if (!concurrencyRelation.isConcurrent(first.label!, second.label!)
                    || !concurrencyRelation.isConcurrent(second.label!, first.label!)) {
                    first.addNextEvent(second);
                }
            }
        }

        po.containedTraces.push(trace);
        po.frequency = trace.frequency;
        return po;
    }

    private performTransitiveReduction(partialOrder: PartialOrder) {
        // algorithm based on "Algorithm A" from https://www.sciencedirect.com/science/article/pii/0304397588900321
        // the paper itself offers an improvement over this Algorithm - might be useful if A proves to be too slow

        const reverseTransitionOrder = this.reverseTopologicalTransitionOrdering(partialOrder);

        const reverseOrder = new Map<string, number>(reverseTransitionOrder.map((t, i) => [t.id, i]));
        const transitiveDescendants = new MapSet<string, string>();
        const reducedDescendants = new MapSet<string, string>();

        for (const t of reverseTransitionOrder) {
            transitiveDescendants.add(t.id, t.id);
            const childrenIds = this.getChildIds(t).sort((id1, id2) => reverseOrder.get(id2)! - reverseOrder.get(id1)!);
            for (const childId of childrenIds) {
                if (!transitiveDescendants.has(t.id, childId)) {
                    transitiveDescendants.addAll(t.id, transitiveDescendants.get(childId));
                    reducedDescendants.add(t.id, childId);
                }
            }
        }

        // remove transitive connections
        for (const first of partialOrder.events) {
            for (const second of first.nextEvents) {
                if (!reducedDescendants.has(first.id, second.id)) {
                    first.removeNextEvent(second);
                }
            }
        }
    }

    private getChildIds(transition: Event): Array<string> {
        return iterateMap(transition.nextEvents, e => e.id);
    }

    /**
     * Returns an array containing the transitions of the given net. The result is in reverse-topological order i.e.
     * transitions at the front of the Array appear later in the net.
     *
     * Implementation based on https://www.geeksforgeeks.org/topological-sorting/3
     * @param po a partial order
     */
    private reverseTopologicalTransitionOrdering(po: PartialOrder): Array<Event> {
        const resultStack: Array<Event> = [];
        const visited = new Set<string>();
        for (const t of po.events) {
            if (visited.has(t.id)) {
                continue;
            }
            this.topologicalOrderingUtil(t, visited, resultStack);
        }
        return resultStack;
    }

    private topologicalOrderingUtil(t: Event, visited: Set<string>, resultStack: Array<Event>) {
        visited.add(t.id);
        for (const nextTransition of t.nextEvents) {
            if (visited.has(nextTransition.id)) {
                continue;
            }
            this.topologicalOrderingUtil(nextTransition, visited, resultStack);
        }
        resultStack.push(t);
    }

    private filterAndCombinePartialOrders(partialOrders: Array<PartialOrder>): Array<PartialOrder> {
        const unique: Array<PartialOrder> = [partialOrders.shift()!];

        for (const uncheckedOrder of partialOrders) {
            let discard = false;
            for (const uniqueOrder of unique) {
                if (this._poIsomorphismService.arePartialOrdersIsomorphic(uncheckedOrder, uniqueOrder)) {
                    discard = true;
                    uniqueOrder.frequency = uniqueOrder.frequency! + uncheckedOrder.frequency!;
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

    private addStartAndStopEvent(po: PartialOrder) {
        po.determineInitialAndFinalEvents();
        const start = new Event(LogSymbol.START, LogSymbol.START);
        const stop = new Event(LogSymbol.STOP, LogSymbol.STOP);

        po.addEvent(start);
        po.addEvent(stop);

        for (const initial of po.initialEvents) {
            start.addNextEvent(initial);
        }

        for (const final of  po.finalEvents) {
            final.addNextEvent(stop);
        }
    }

}
