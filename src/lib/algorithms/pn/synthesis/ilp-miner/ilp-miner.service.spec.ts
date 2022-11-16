import {TestBed} from '@angular/core/testing';
import {IlpMinerService} from './ilp-miner.service';

describe('IlpMinerService', () => {
    let service: IlpMinerService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(IlpMinerService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
