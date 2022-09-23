import {expect} from '@angular/flex-layout/_private-utils/testing';
import {OccurenceMatrixType, OccurrenceMatrix} from './occurrence-matrix';


describe('OccurrenceMatrix', () => {

    it('should add key when an entry is added', () => {
        const matrix = new OccurrenceMatrix(OccurenceMatrixType.WILDCARD);
        expect(matrix).toBeTruthy();

        matrix.add('A','B');
        expect(matrix.get('A','B')).toBeTrue();
        expect(matrix.keys.size).toBe(2);
        expect(matrix.keys.has('A')).toBeTrue();
        expect(matrix.keys.has('B')).toBeTrue();

        matrix.add('A', 'C');
        expect(matrix.get('A','C')).toBeTrue();
        expect(matrix.keys.size).toBe(3);
        expect(matrix.keys.has('A')).toBeTrue();
        expect(matrix.keys.has('B')).toBeTrue();
        expect(matrix.keys.has('C')).toBeTrue();
    });

});
