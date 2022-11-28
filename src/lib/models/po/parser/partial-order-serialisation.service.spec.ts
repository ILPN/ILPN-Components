import {TestBed} from '@angular/core/testing';
import {PartialOrderSerialisationService} from './partial-order-serialisation.service';


describe('PartialOrderSerialisationService', () => {
    let service: PartialOrderSerialisationService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(PartialOrderSerialisationService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();

        expect('tests').toBe('written');
    });
});
