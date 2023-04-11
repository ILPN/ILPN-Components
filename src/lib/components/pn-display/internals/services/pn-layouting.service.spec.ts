import {TestBed} from '@angular/core/testing';
import {PnLayoutingService} from './pn-layouting.service';

describe('PnLayoutingService', () => {
    let service: PnLayoutingService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(PnLayoutingService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
