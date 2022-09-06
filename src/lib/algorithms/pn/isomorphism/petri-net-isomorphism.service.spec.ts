import {TestBed} from '@angular/core/testing';
import {PetriNetIsomorphismService} from './petri-net-isomorphism.service';

describe('PetriNetIsomorphismService', () => {
    let service: PetriNetIsomorphismService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(PetriNetIsomorphismService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
