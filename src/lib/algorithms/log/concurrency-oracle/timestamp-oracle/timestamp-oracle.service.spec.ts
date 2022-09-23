import {TimestampOracleService} from './timestamp-oracle.service';
import {TestBed} from '@angular/core/testing';
import {expect} from '@angular/flex-layout/_private-utils/testing';
import {Lifecycle} from '../../../../models/log/model/lifecycle';
import {Trace} from '../../../../models/log/model/trace';
import {LogEvent} from '../../../../models/log/model/logEvent';


describe('TimestampOracleService', () => {
    let service: TimestampOracleService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(TimestampOracleService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should create mock trace', () => {
        const trace = createMockTrace([{n: 'A', p: Lifecycle.START}, {n: 'B', p: Lifecycle.COMPLETE}]);
        expect(trace).toBeTruthy();
        expect(trace.events).toBeTruthy();
        expect(Array.isArray(trace.events)).toBeTrue();
        expect(trace.events.length).toBe(2);
        expect(trace.events[0].name).toBe('A');
        expect(trace.events[0].lifecycle).toBe(Lifecycle.START);
        expect(trace.events[1].name).toBe('B');
        expect(trace.events[1].lifecycle).toBe(Lifecycle.COMPLETE);
    });

    it('should detect concurrency', () => {
        // |-A-||-B-|
        let trace = createMockTrace([
            {n: 'A', p: Lifecycle.START},
            {n: 'A', p: Lifecycle.COMPLETE},
            {n: 'B',p: Lifecycle.START},
            {n: 'B', p: Lifecycle.COMPLETE}
        ]);

        let concurrency = service.determineConcurrency([trace]);
        expect(concurrency).toBeTruthy();
        expect(concurrency.isConcurrent('A', 'B')).toBeFalse();

        // |-A-|
        //   |-B-|
        trace = createMockTrace([
            {n: 'A', p: Lifecycle.START},
            {n: 'B',p: Lifecycle.START},
            {n: 'A', p: Lifecycle.COMPLETE},
            {n: 'B', p: Lifecycle.COMPLETE}
        ]);

        concurrency = service.determineConcurrency([trace]);
        expect(concurrency).toBeTruthy();
        expect(concurrency.isConcurrent('A', 'B')).toBeTrue();

        // |-A-|
        //   |--B--|
        //       |-C-|
        trace = createMockTrace([
            {n: 'A', p: Lifecycle.START},
            {n: 'B',p: Lifecycle.START},
            {n: 'A', p: Lifecycle.COMPLETE},
            {n: 'C',p: Lifecycle.START},
            {n: 'B', p: Lifecycle.COMPLETE},
            {n: 'C', p: Lifecycle.COMPLETE}
        ]);

        concurrency = service.determineConcurrency([trace]);
        expect(concurrency).toBeTruthy();
        expect(concurrency.isConcurrent('A', 'B')).toBeTrue();
        expect(concurrency.isConcurrent('B', 'C')).toBeTrue();
        expect(concurrency.isConcurrent('A', 'C')).toBeFalse();

        // |-----A-----|
        //   |---B---|
        //     |-C-|
        trace = createMockTrace([
            {n: 'A', p: Lifecycle.START},
            {n: 'B',p: Lifecycle.START},
            {n: 'C',p: Lifecycle.START},
            {n: 'C', p: Lifecycle.COMPLETE},
            {n: 'B', p: Lifecycle.COMPLETE},
            {n: 'A', p: Lifecycle.COMPLETE},
        ]);

        concurrency = service.determineConcurrency([trace]);
        expect(concurrency).toBeTruthy();
        expect(concurrency.isConcurrent('A', 'B')).toBeTrue();
        expect(concurrency.isConcurrent('B', 'C')).toBeTrue();
        expect(concurrency.isConcurrent('A', 'C')).toBeTrue();

        // A |-B-|
        trace = createMockTrace([
            {n: 'A', p: Lifecycle.COMPLETE},
            {n: 'B',p: Lifecycle.START},
            {n: 'B', p: Lifecycle.COMPLETE}
        ]);

        concurrency = service.determineConcurrency([trace]);
        expect(concurrency).toBeTruthy();
        expect(concurrency.isConcurrent('A', 'B')).toBeFalse();

        // |-A-| B
        trace = createMockTrace([
            {n: 'A',p: Lifecycle.START},
            {n: 'A', p: Lifecycle.COMPLETE},
            {n: 'B', p: Lifecycle.COMPLETE}
        ]);

        concurrency = service.determineConcurrency([trace]);
        expect(concurrency).toBeTruthy();
        expect(concurrency.isConcurrent('A', 'B')).toBeFalse();

        // |-A-|
        //   B
        trace = createMockTrace([
            {n: 'A',p: Lifecycle.START},
            {n: 'B', p: Lifecycle.COMPLETE},
            {n: 'A', p: Lifecycle.COMPLETE}
        ]);

        concurrency = service.determineConcurrency([trace]);
        expect(concurrency).toBeTruthy();
        expect(concurrency.isConcurrent('A', 'B')).toBeTrue();
    });

});

function createMockTrace(events: Array<{ n: string, p: Lifecycle }>): Trace {
    const trace = new Trace();
    for (const e of events) {
        const event = new LogEvent(e.n);
        event.lifecycle = e.p;
        trace.events.push(event);
    }
    return trace;
}
