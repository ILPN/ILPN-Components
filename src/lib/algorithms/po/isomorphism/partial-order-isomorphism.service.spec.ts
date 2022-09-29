import {TestBed} from '@angular/core/testing';
import {PartialOrderIsomorphismService} from './partial-order-isomorphism.service';

describe('PartialOrderIsomorphismService', () => {
    let service: PartialOrderIsomorphismService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(PartialOrderIsomorphismService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
