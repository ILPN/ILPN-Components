import {createMockTrace} from './create-mock-trace';
import {Lifecycle} from '../../models/log/model/lifecycle';
import {expect} from '@angular/flex-layout/_private-utils/testing';


describe('createMockTrace', () => {

    it('should create mock trace', () => {
        const trace = createMockTrace({n: 'A', p: Lifecycle.START}, 'B', {n: 'C', p: Lifecycle.COMPLETE});
        expect(trace).toBeTruthy();
        expect(trace.events).toBeTruthy();
        expect(Array.isArray(trace.events)).toBeTrue();
        expect(trace.events.length).toBe(3);
        expect(trace.events[0].name).toBe('A');
        expect(trace.events[0].lifecycle).toBe(Lifecycle.START);
        expect(trace.events[1].name).toBe('B');
        expect(trace.events[1].lifecycle).toBeUndefined();
        expect(trace.events[2].name).toBe('C');
        expect(trace.events[2].lifecycle).toBe(Lifecycle.COMPLETE);
    });

});
