import {TestBed} from "@angular/core/testing";
import {DanglingPlaceRemoverService} from "./dangling-place-remover.service";
import {PetriNetParserService} from "../../../models/pn/io/parser/petri-net-parser.service";
import {PetriNetIsomorphismService} from "../isomorphism/petri-net-isomorphism.service";



describe('DanglingPlaceRemoverService', () => {
    let service: DanglingPlaceRemoverService;
    let parser: PetriNetParserService;
    let isomorphism: PetriNetIsomorphismService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(DanglingPlaceRemoverService);
        expect(service).toBeTruthy();
        parser = TestBed.inject(PetriNetParserService);
        expect(parser).toBeTruthy();
        isomorphism = TestBed.inject(PetriNetIsomorphismService);
        expect(isomorphism).toBeTruthy();
    });

    it('should remove dangling places', () => {
        const dangling = parser.parse(`.type pn
.transitions
a A
b B
c C
.places
0 0
1 0
2 0
3 0
4 0
5 0
.arcs
0 a
a 1
1 b
b 2
2 c
c 3
a 4
a 5
b 5
`)!;
        expect(dangling).toBeTruthy();

        const removed = service.removeDanglingPlaces(dangling);
        expect(removed).toBeTruthy();

        const result = parser.parse(`.type pn
.transitions
a A
b B
c C
.places
0 0
1 0
2 0
3 0
.arcs
0 a
a 1
1 b
b 2
2 c
c 3
`)!;
        expect(result).toBeTruthy();
        expect(isomorphism.arePetriNetsIsomorphic(removed, result)).toBeTrue();
    });
});
