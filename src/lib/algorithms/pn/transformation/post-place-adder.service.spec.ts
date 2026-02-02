import {TestBed} from "@angular/core/testing";
import {PostPlaceAdderService} from "./post-place-adder.service";
import {PetriNetParserService} from "../../../models/pn/io/parser/petri-net-parser.service";
import {PetriNetIsomorphismService} from "../isomorphism/petri-net-isomorphism.service";



describe('PostPlaceAdderService', () => {
    let service: PostPlaceAdderService;
    let parser: PetriNetParserService;
    let isomorphism: PetriNetIsomorphismService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(PostPlaceAdderService);
        expect(service).toBeTruthy();
        parser = TestBed.inject(PetriNetParserService);
        expect(parser).toBeTruthy();
        isomorphism = TestBed.inject(PetriNetIsomorphismService);
        expect(isomorphism).toBeTruthy();
    });

    it('should add places to transitions with empty post-set', () => {
        const emptyPost = parser.parse(`.type pn
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
.arcs
0 a
1 a
3 c
c 4
4 d
d 3
d 2
`)!;
        expect(emptyPost).toBeTruthy();

        const added = service.addPostPlaces(emptyPost);
        expect(added).toBeTruthy();

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
n1 0
n2 0
.arcs
0 a
1 a
3 c
c 4
4 d
d 3
d 2
a n1
b n2
`)!;
        expect(result).toBeTruthy();
        expect(isomorphism.arePetriNetsIsomorphic(added, result)).toBeTrue();
    });
});
