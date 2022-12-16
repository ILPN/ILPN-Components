import {TestBed} from '@angular/core/testing';
import {Ilp2MinerService} from './ilp2-miner.service';


describe('Ilp2MinerService', () => {
    let service: Ilp2MinerService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(Ilp2MinerService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
