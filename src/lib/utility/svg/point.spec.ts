import {areVectorsParallel} from "./point";

describe('Point', () => {

    it('areVectorsParallel', () => {
        expect(areVectorsParallel({x: 10000, y: 0}, {x: 10000, y: 0})).toBeTrue();
        expect(areVectorsParallel({x: 10000, y: 0}, {x: 1000, y: 0})).toBeTrue();
        expect(areVectorsParallel({x: 10000, y: 0}, {x: 10000, y: 1})).toBeTrue();
        expect(areVectorsParallel({x: 10000, y: 0}, {x: 10000, y: -1})).toBeTrue();

        expect(areVectorsParallel({x: 100, y: 5}, {x: 100, y:-5})).toBeFalse();
        expect(areVectorsParallel({x: 100, y: 0}, {x: -100, y:0})).toBeFalse();
    });

});
