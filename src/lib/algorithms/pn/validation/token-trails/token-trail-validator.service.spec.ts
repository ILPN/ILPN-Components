import {TestBed} from '@angular/core/testing';
import {TokenTrailValidatorService} from './token-trail-validator.service';


describe('TokenTrailValidatorService', () => {
    let service: TokenTrailValidatorService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(TokenTrailValidatorService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
        expect('tests').toBe('written');
    });
});
