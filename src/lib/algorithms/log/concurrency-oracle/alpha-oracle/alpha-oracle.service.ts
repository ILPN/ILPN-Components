import {Injectable} from '@angular/core';
import {ConcurrencyOracle} from '../concurrency-oracle';
import {Trace} from '../../../../models/log/model/trace';
import {Observable, of} from 'rxjs';
import {PetriNet} from '../../../../models/pn/model/petri-net';
import {AlphaOracleConfiguration} from './alpha-oracle-configuration';
import {OccurrenceMatrix} from './occurrence-matrix';
import {PrefixTree} from '../../../../utility/prefix-tree';
import {PetriNetSequence} from './petri-net-sequence';
import {IncrementingCounter} from '../../../../utility/incrementing-counter';
import {TraceConversionResult} from './trace-conversion-result';

@Injectable({
    providedIn: 'root'
})
export class AlphaOracleService implements ConcurrencyOracle {

    constructor() {
    }

    determineConcurrency(log: Array<Trace>, config: AlphaOracleConfiguration = {}): Observable<Array<PetriNet>> {
        const transformedTraces = this.convertLogToPetriNetSequences(log, config.lookAheadDistance);

        return of([]);
    }

    private convertLogToPetriNetSequences(log: Array<Trace>, lookAheadDistance: number = 1): TraceConversionResult {
        const netSequences = new Set<PetriNet>();
        const tree = new PrefixTree<PetriNetSequence>(new PetriNetSequence());
        const matrix: OccurrenceMatrix = {};
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
                        this.insert(matrix, e, step);
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

    private insert(matrix: OccurrenceMatrix, e1: string, e2: string, value: boolean = true) {
        const row = matrix[e1];
        if (row === undefined) {
            matrix[e1] = {[e2]: value};
            return;
        }
        row[e2] = value;
    }

    private read(matrix: OccurrenceMatrix, e1: string, e2: string): boolean {
        const row = matrix[e1];
        if (row === undefined) {
            return false;
        }
        return !!row[e2];
    }
}
