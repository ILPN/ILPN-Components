import {TestBed} from '@angular/core/testing';
import {DuplicatePlaceRemoverService} from './duplicate-place-remover.service';
import {PetriNetParserService} from '../../../models/pn/parser/petri-net-parser.service';
import {PetriNetIsomorphismService} from '../isomorphism/petri-net-isomorphism.service';


describe('DuplicatePlaceRemoverService', () => {
    let service: DuplicatePlaceRemoverService;
    let parser: PetriNetParserService;
    let isomorphism: PetriNetIsomorphismService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(DuplicatePlaceRemoverService);
        parser = TestBed.inject(PetriNetParserService);
        expect(parser).toBeTruthy();
        isomorphism = TestBed.inject(PetriNetIsomorphismService);
        expect(isomorphism).toBeTruthy();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should remove duplicate places', () => {
        expect(service).toBeTruthy();
        const duplicate = parser.parse(`.type pn
.transitions
a A
b B
c C
d D
.places
0 0
1 0
2 0
3 0
4 0
5 0
6 0
7 0
8 0
9 0
10 0
11 0
12 0
.arcs
0 a
1 a
2 b
a 3
a 4
a 5
b 6
b 7
a 8
b 8
a 9
b 9
3 c
4 c
5 c
6 d
7 d
8 c
8 d
9 c
9 d
c 10
c 11
d 12
`)!;
        expect(duplicate).toBeTruthy();

        const removed = service.removeDuplicatePlaces(duplicate);
        expect(removed).toBeTruthy();

        const result = parser.parse(`.type pn
.transitions
a A
b B
c C
d D
.places
0 0
1 0
2 0
3 0
4 0
5 0
6 0
.arcs
0 a
1 b
a 2
b 3
a 4
b 4
2 c
3 d
4 c
4 d
c 5
d 6
`)!;
        expect(result).toBeTruthy();
        expect(isomorphism.arePetriNetsIsomorphic(removed, result)).toBeTrue();
    });
});
