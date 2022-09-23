import {Injectable} from '@angular/core';
import {ConcurrencyOracle} from '../concurrency-oracle';
import {Trace} from '../../../../models/log/model/trace';
import {ConcurrencyRelation} from '../../../../models/concurrency/model/concurrency-relation';
import {Relabeler} from '../../../../utility/relabeler';
import {LogEvent} from '../../../../models/log/model/logEvent';
import {Lifecycle} from '../../../../models/log/model/lifecycle';
import {OccurenceMatrixType, OccurrenceMatrix} from '../occurrence-matrix';


@Injectable({
    providedIn: 'root'
})
export class TimestampOracleService implements ConcurrencyOracle {
    determineConcurrency(log: Array<Trace>): ConcurrencyRelation {
        if (log.length === 0) {
            return ConcurrencyRelation.noConcurrency();
        }

        log.forEach(t => {
            this.filterTraceAndPairStartCompleteEvents(t);
        })

        const relabeler = new Relabeler();
        relabeler.relabelSequencesPreserveNonUniqueIdentities(log);

        const matrix = this.constructOccurrenceMatrix(log);
        return ConcurrencyRelation.fromOccurrenceMatrix(matrix, relabeler);
    }

    protected filterTraceAndPairStartCompleteEvents(trace: Trace) {
        const startedEvents = new Map<string, LogEvent>();

        for (const e of trace.events) {
            switch (e.lifecycle) {
                case Lifecycle.START:
                    if (startedEvents.has(e.name)) {
                        throw new Error('TimestampOracle does not currently support auto-concurrency in the log!');
                    }
                    startedEvents.set(e.name, e);
                    break;
                case Lifecycle.COMPLETE:
                    if (startedEvents.has(e.name)) {
                        startedEvents.delete(e.name);
                    }
                    break;
            }
        }

        if (startedEvents.size > 0) {
            // unpaired start events exist
            const unpaired = Array.from(startedEvents.values());
            trace.events = trace.events.filter(e => !unpaired.includes(e));
        }
    }

    protected constructOccurrenceMatrix(log: Array<Trace>): OccurrenceMatrix {
        const matrix = new OccurrenceMatrix(OccurenceMatrixType.WILDCARD);

        for (const trace of log) {
            const startedEvents = new Set<string>();
            for (const event of trace.events) {
                switch (event.lifecycle) {
                    case Lifecycle.START:
                        this.addAllInProgressToMatrix(event.name, startedEvents, matrix);
                        startedEvents.add(event.name);
                        break;
                    case Lifecycle.COMPLETE:
                        if (startedEvents.has(event.name)) {
                            startedEvents.delete(event.name);
                        } else {
                            // standalone
                            this.addAllInProgressToMatrix(event.name, startedEvents, matrix);
                        }
                        break;
                }
            }
        }

        return matrix;
    }

    protected addAllInProgressToMatrix(started: string, inProgress: Set<string>, matrix: OccurrenceMatrix): void {
        for (const progress of inProgress) {
            matrix.add(started, progress);
            matrix.add(progress, started);
        }
    }
}
