import {SpringEmbedderLayoutManager} from "./spring-embedder-layout-manager";
import {TestBed} from "@angular/core/testing";
import {expect} from "@angular/flex-layout/_private-utils/testing";
import {areVectorsParallel, Point} from "../../../../utility/svg/point";
import {SpringEmbedderLayoutManagerFactoryService} from "./spring-embedder-layout-manager-factory.service";

describe('SpringEmbedderLayoutManager', () => {
    let service: SpringEmbedderLayoutManager;
    let serviceFactory: SpringEmbedderLayoutManagerFactoryService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        serviceFactory = TestBed.inject(SpringEmbedderLayoutManagerFactoryService);
        service = serviceFactory.create();
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
            {x: -10, y: -1},
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
            const force = service['arcRotationForce'](delta, 1.0);

            const expectedForceDirection = expectedNormalizedForceDirections[i];
            const parallel = areVectorsParallel(force, expectedForceDirection);
            expect(parallel).toBeTrue();
        }

    });

    it('should compute correct grid axis force', () => {
        const GRID = SpringEmbedderLayoutManager['GRID_SIZE'];
        const HALF_GRID = SpringEmbedderLayoutManager['HALF_GRID_SIZE'];

        expect(service['gridAxisForce'](GRID - 5)).toBe(5);
        expect(service['gridAxisForce'](GRID + 5)).toBe(-5);
        expect(service['gridAxisForce'](-GRID + 5)).toBe(-5);
        expect(service['gridAxisForce'](-GRID - 5)).toBe(5);

        expect(service['gridAxisForce'](HALF_GRID)).toBe(-HALF_GRID);
        expect(service['gridAxisForce'](-HALF_GRID)).toBe(HALF_GRID);
    });
});
