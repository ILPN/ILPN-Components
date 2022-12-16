import {TestBed} from '@angular/core/testing';
import {IlpplMinerService} from './ilppl-miner.service';


describe('IlpplMinerService', () => {
    let service: IlpplMinerService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(IlpplMinerService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();

        expect('tests').toBe('written');
    });
});
