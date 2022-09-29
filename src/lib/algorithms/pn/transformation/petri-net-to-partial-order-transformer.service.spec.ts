import {TestBed} from '@angular/core/testing';
import {PetriNetToPartialOrderTransformerService} from './petri-net-to-partial-order-transformer.service';

describe('PetriNetToPartialOrderTransformerService', () => {
    let service: PetriNetToPartialOrderTransformerService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(PetriNetToPartialOrderTransformerService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
