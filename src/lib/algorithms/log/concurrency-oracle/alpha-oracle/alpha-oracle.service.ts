import {Injectable} from '@angular/core';
import {ConcurrencyOracle} from '../concurrency-oracle';
import {Trace} from '../../../../models/log/model/trace';
import {Observable, of} from 'rxjs';
import {PetriNet} from '../../../../models/pn/model/petri-net';
import {AlphaOracleConfiguration} from './alpha-oracle-configuration';
import {OccurrenceMatrix} from './occurrence-matrix';
import {PrefixTree} from '../../../../utility/prefix-tree';
import {PetriNetSequence} from './petri-net-sequence';
import {createUniqueName, IncrementingCounter} from '../../../../utility/incrementing-counter';
import {TraceConversionResult} from './trace-conversion-result';
import {Place} from '../../../../models/pn/model/place';
import {Transition} from '../../../../models/pn/model/transition';
import {Arc} from '../../../../models/pn/model/arc';

@Injectable({
    providedIn: 'root'
})
export class AlphaOracleService implements ConcurrencyOracle {

    constructor() {
    }

    determineConcurrency(log: Array<Trace>, config: AlphaOracleConfiguration = {}): Observable<Array<PetriNet>> {
        const transformedTraces = this.convertLogToPetriNetSequences(log, config.lookAheadDistance);
        // TODO add start stop
        const partialOrders = this.convertSequencesToPartialOrders(transformedTraces);
        // TODO filter & combine

        return of(partialOrders);
    }

    private convertLogToPetriNetSequences(log: Array<Trace>, lookAheadDistance: number = 1): TraceConversionResult {
        const netSequences = new Set<PetriNet>();
        const tree = new PrefixTree<PetriNetSequence>(new PetriNetSequence());
        const matrix = new OccurrenceMatrix();
        const counter = new IncrementingCounter();

        for (const trace of log) {
            const prefix: Array<string> = [];

            tree.insert(trace,
                () => {
                    throw new Error('should never be called');
                },
                node => {
                    node.net.frequency = node.net.frequency === undefined ? 1 : node.net.frequency + 1;
                    netSequences.add(node.net);
                },
                undefined,
                (step, previousNode) => {
                    // occurrence matrix
                    if (prefix.length > lookAheadDistance) {
                        prefix.unshift();
                    }
                    for (const e of prefix) {
                        matrix.set(e, step);
                    }
                    prefix.push(step);

                    // create new node
                    const newNode = previousNode!.clone();
                    newNode.appendTransition(step, counter);
                    return newNode;
                }
            );
        }

        return {
            nets: Array.from(netSequences.values()),
            occurrenceMatrix: matrix
        };
    }

    private convertSequencesToPartialOrders(sequencesAndConcurrencyInformation: TraceConversionResult): Array<PetriNet> {
        return sequencesAndConcurrencyInformation.nets.map(seq => this.convertSequenceToPartialOrder(seq, sequencesAndConcurrencyInformation.occurrenceMatrix));
    }

    private convertSequenceToPartialOrder(sequence: PetriNet, hasOccurredInOrder: OccurrenceMatrix): PetriNet {
        const placeQueue = sequence.getPlaces();
        const placeIds = new Set<string>(placeQueue.map(p => p.id));
        const arcIds = new Set<string>(sequence.getArcs().map(a => a.id));
        const counter = new IncrementingCounter();

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
            if (!hasOccurredInOrder.get(preEvent.label!, postEvent.label!) || !hasOccurredInOrder.get(postEvent.label!, preEvent.label!)) {
                continue;
            }

            sequence.removePlace(place);

            for (const a of preEvent.ingoingArcs) {
                const inPlace = a.source as Place;
                const clone = new Place(createUniqueName('p', placeIds, counter),0,0,0);
                sequence.addPlace(clone);

                for (const inArc of inPlace.ingoingArcs) {
                    sequence.addArc(new Arc(createUniqueName('a', arcIds, counter), inArc.source, clone, 1));
                }

                sequence.addArc(new Arc(createUniqueName('a', arcIds, counter), clone, postEvent, 1))
            }

            for (const a of postEvent.outgoingArcs) {
                const outPlace = a.destination as Place;
                const clone = new Place(createUniqueName('p', placeIds, counter),0,0,0);
                sequence.addPlace(clone);

                for (const outArc of outPlace.outgoingArcs) {
                    sequence.addArc(new Arc(createUniqueName('a', arcIds, counter), clone, outArc.destination, 1));
                }

                sequence.addArc(new Arc(createUniqueName('a', arcIds, counter), preEvent, clone, 1))
            }
        }
    }
}
