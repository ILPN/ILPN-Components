import {TestBed} from '@angular/core/testing';
import {DuplicatePlaceRemoverService} from './duplicate-place-remover.service';


describe('DuplicatePlaceRemoverService', () => {
    let service: DuplicatePlaceRemoverService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(DuplicatePlaceRemoverService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();

        expect('tests').toBe('written');
    });
});
