import {TestBed} from '@angular/core/testing';
import {PetriNetReachabilityService} from './petri-net-reachability.service';

describe('PetriNetReachabilityService', () => {
    let service: PetriNetReachabilityService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(PetriNetReachabilityService);
    });

    it('should be created', () => {
        expect('tests').toBe('written');
    });
});
