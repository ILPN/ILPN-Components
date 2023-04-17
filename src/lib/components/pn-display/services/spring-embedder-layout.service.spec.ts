import {SpringEmbedderLayoutService} from "./spring-embedder-layout.service";
import {TestBed} from "@angular/core/testing";
import {expect} from "@angular/flex-layout/_private-utils/testing";
import {areVectorsParallel, Point} from "../../../utility/svg/point";

describe('SpringEmbedderLayoutService', () => {
    let service: SpringEmbedderLayoutService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(SpringEmbedderLayoutService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should compute correct direction for rotational arc force', () => {
        const deltas: Array<Point> = [
            {x: 10, y: -1},
            {x: 10, y: 1},
            {x: 11, y: 10},
            {x: 10, y: 11},
            {x: 1, y: 10},
            {x: -1, y: 10},
            {x: -10, y: 11},
            {x: -11, y: 10},
            {x: -10, y: 1},
            {x: -10, y: 1},
            {x: -11, y: -10},
            {x: -10, y: -11},
            {x: -1, y: -10},
            {x: 1, y: -10},
            {x: 10, y: -11},
            {x: 11, y: -10}
        ];
        expect(deltas.length).toBe(16);
        const expectedNormalizedForceDirections: Array<Point> = [
            {x: 0, y: 1},
            {x: 0, y: -1},
            {x: -1, y: 1},
            {x: 1, y: -1},
            {x: -1, y: 0},
            {x: 1, y: 0},
            {x: -1, y: -1},
            {x: 1, y: 1},
            {x: 0, y: -1},
            {x: 0, y: 1},
            {x: 1, y: -1},
            {x: -1, y: 1},
            {x: 1, y: 0},
            {x: -1, y: 0},
            {x: 1, y: 1},
            {x: -1, y: -1},
        ];
        expect(expectedNormalizedForceDirections.length).toBe(16);

        for (let i = 0; i < deltas.length; i++) {
            const delta = deltas[i];
            // bypass private modifier in tests: https://stackoverflow.com/a/35991491/15893674
            const force = service['arcRotationForce'](delta);

            const expectedForceDirection = expectedNormalizedForceDirections[i];
            const parallel = areVectorsParallel(force, expectedForceDirection);
            expect(parallel).toBeTrue();
        }

    });
});
