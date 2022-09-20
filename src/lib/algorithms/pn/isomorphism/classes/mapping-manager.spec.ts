import {expect} from '@angular/flex-layout/_private-utils/testing';
import {MapSet} from '../../../../utility/map-set';
import {MappingManager} from './mapping-manager';

describe('MappingManager', () => {
    it('should cycle mappings', () => {
        let mappings = new MapSet<string, string>();
        mappings.addAll('a', ['a1', 'a2']);
        mappings.addAll('b', ['b1', 'b2']);
        let manager = new MappingManager(mappings);

        expect(manager).toBeTruthy();
        let current = manager.getCurrentMapping();
        expect(current.size).toBe(2);
        expect(current.get('a')).toBe('a1');
        expect(current.get('b')).toBe('b1');

        let carry = manager.moveToNextMapping();
        expect(carry).toBeFalse();
        current = manager.getCurrentMapping();
        expect(current.size).toBe(2);
        expect(current.get('a')).toBe('a2');
        expect(current.get('b')).toBe('b1');

        carry = manager.moveToNextMapping();
        expect(carry).toBeFalse();
        current = manager.getCurrentMapping();
        expect(current.size).toBe(2);
        expect(current.get('a')).toBe('a1');
        expect(current.get('b')).toBe('b2');

        carry = manager.moveToNextMapping();
        expect(carry).toBeFalse();
        current = manager.getCurrentMapping();
        expect(current.size).toBe(2);
        expect(current.get('a')).toBe('a2');
        expect(current.get('b')).toBe('b2');

        carry = manager.moveToNextMapping();
        expect(carry).toBeTrue();
        current = manager.getCurrentMapping();
        expect(current.size).toBe(2);
        expect(current.get('a')).toBe('a1');
        expect(current.get('b')).toBe('b1');
    });

    it('should hold mapping', () => {
        let mappings = new MapSet<string, string>();
        mappings.add('a', 'a');
        mappings.add('b', 'b');
        let manager = new MappingManager(mappings);

        expect(manager).toBeTruthy();
        let current = manager.getCurrentMapping();
        expect(current.size).toBe(2);
        expect(current.get('a')).toBe('a');
        expect(current.get('b')).toBe('b');

        let carry = manager.moveToNextMapping();
        expect(carry).toBeTrue();
        current = manager.getCurrentMapping();
        expect(current.size).toBe(2);
        expect(current.get('a')).toBe('a');
        expect(current.get('b')).toBe('b');

        carry = manager.moveToNextMapping();
        expect(carry).toBeTrue();
        current = manager.getCurrentMapping();
        expect(current.size).toBe(2);
        expect(current.get('a')).toBe('a');
        expect(current.get('b')).toBe('b');
    });
});
