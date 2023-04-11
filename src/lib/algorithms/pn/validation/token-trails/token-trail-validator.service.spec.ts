import {TestBed} from '@angular/core/testing';
import {TokenTrailValidatorService} from './token-trail-validator.service';
import {PetriNet} from "../../../../models/pn/model/petri-net";
import {PetriNetParserService} from "../../../../models/pn/parser/petri-net-parser.service";
import {take} from "rxjs";


describe('TokenTrailValidatorService', () => {
    let service: TokenTrailValidatorService;
    let parser: PetriNetParserService;

    let netFig1: PetriNet;
    let firingSequenceFig5: PetriNet;
    let stateGraphFig7: PetriNet;
    let partialOrderFig10b: PetriNet;
    let netThreeTokens: PetriNet;
    let threeTokensFig12: PetriNet;
    let netComplexMarking: PetriNet;
    let complexMarkingFig12: PetriNet;
    let bXorBxbFig13: PetriNet;
    let netFig15b: PetriNet;
    let arcWeightsFig15b: PetriNet;

    let defaultTimeoutInterval: number;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(TokenTrailValidatorService);
        parser = TestBed.inject(PetriNetParserService);
        expect(parser).toBeTruthy();

        defaultTimeoutInterval = jasmine.DEFAULT_TIMEOUT_INTERVAL;
        // jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;

        // Petri net models and specifications are taken from the token trails paper
        netFig1 = parser.parse(`.type pn
.transitions
a A
b B
c C
d D
x X
.places
p1 1
p2 0
p3 0
p4 0
p5 1
p6 0
p7 0
p8 0
.arcs
p1 a 1
a p2 1
a p3 2
a p4 1
p2 b 1
x p2 1
p3 x 1
p4 c 1
b p6 1
p6 x 1
x p5 1
p5 x 1
p5 c 1
c p7 1
p6 d 1
p7 d 1
d p8 1`)!;
        expect(netFig1).toBeTruthy();

        firingSequenceFig5 = parser.parse(`.type pn
.transitions
a A
b1 B
x X
c C
b2 B
d D
.places
c1 1
c2 0
c3 0
c4 0
c5 0
c6 0
c7 0
.arcs
c1 a 1
a c2 1
c2 b1 1
b1 c3 1
c3 x 1
x c4 1
c4 c 1
c c5 1
c5 b2 1
b2 c6 1
c6 d 1
d c7 1`)!;
        expect(firingSequenceFig5).toBeTruthy();

        stateGraphFig7 = parser.parse(`.type pn
.transitions
a A
b1 B
b2 B
b3 B
x1 X
x2 X
c_1 C
c_2 C
c_3 C
c_4 C
c_5 C
c_6 C
b4 B
b5 B
b6 B
d1 D
d2 D
d3 D
.places
c1 1
c2 0
c3 0
c4 0
c5 0
c6 0
c7 0
c8 0
c9 0
c10 0
c11 0
c12 0
c13 0
c14 0
c15 0
c16 0
.arcs
c1 a 1
a c2 1
c2 b1 1
b1 c3 1
c3 x1 1
x1 c4 1
c4 b2 1
b2 c5 1
c5 x2 1
x2 c6 1
c6 b3 1
b3 c7 1
c2 c_1 1
c_1 c8 1
c3 c_2 1
c_2 c9 1
c4 c_3 1
c_3 c10 1
c5 c_4 1
c_4 c11 1
c6 c_5 1
c_5 c12 1
c7 c_6 1
c_6 c13 1
c8 b4 1
b4 c9 1
c9 d1 1
d1 c14 1
c10 b5 1
b5 c11 1
c11 d2 1
d2 c15 1
c12 b6 1
b6 c13 1
c13 d3 1
d3 c16 1`)!;
        expect(stateGraphFig7).toBeTruthy();

        partialOrderFig10b = parser.parse(`.type pn
.transitions
e5 A
e6 B
e7 X
e8 B
e9 C
e10 D
.places
c7 1
c8 0
c9 0
c10 0
c11 0
c12 0
c13 0
c14 0
c15 0
.arcs
c7 e5 1
e5 c8 1
e5 c9 1
c8 e6 1
c9 e9 1
e6 c10 1
c10 e7 1
e7 c11 1
e7 c12 1
c11 e8 1
c12 e9 1
e8 c13 1
c13 e10 1
e9 c14 1
c14 e10 1
e10 c15 1`)!;
        expect(partialOrderFig10b).toBeTruthy();

        netThreeTokens = parser.parse(`.type pn
.transitions
a A
b B
c C
d D
x X
.places
p1 3
p2 0
p3 0
p4 0
p5 3
p6 0
p7 0
p8 0
.arcs
p1 a 1
a p2 1
a p3 2
a p4 1
p2 b 1
x p2 1
p3 x 1
p4 c 1
b p6 1
p6 x 1
x p5 1
p5 x 1
p5 c 1
c p7 1
p6 d 1
p7 d 1
d p8 1`)!;
        expect(netThreeTokens).toBeTruthy();

        threeTokensFig12 = parser.parse(`.type pn
.transitions
a A
b1 B
x X
c C
b2 B
d D
.places
c1 3
c2 0
c3 0
c4 0
c5 0
c6 0
c7 0
.arcs
c1 a 1
a c2 1
c2 b1 1
b1 c3 1
c3 x 1
x c4 1
c4 c 1
c c5 1
c5 b2 1
b2 c6 1
c6 d 1
d c7 1`)!;
        expect(threeTokensFig12).toBeTruthy();

        netComplexMarking = parser.parse(`.type pn
.transitions
a A
b B
c C
d D
x X
.places
p1 1
p2 1
p3 1
p4 0
p5 1
p6 0
p7 1
p8 0
.arcs
p1 a 1
a p2 1
a p3 2
a p4 1
p2 b 1
x p2 1
p3 x 1
p4 c 1
b p6 1
p6 x 1
x p5 1
p5 x 1
p5 c 1
c p7 1
p6 d 1
p7 d 1
d p8 1`)!;
        expect(netComplexMarking).toBeTruthy();

        complexMarkingFig12 = parser.parse(`.type pn
.transitions
a A
b1 B
x X
c C
b2 B
d D
.places
c1 1
c2 0
c3 0
c4 0
c5 1
c6 0
c7 0
.arcs
c1 a 1
a c2 1
c2 b1 1
b1 c3 1
c3 x 1
x c4 1
c4 c 1
c c5 1
c5 b2 1
b2 c6 1
c6 d 1
d c7 1`)!;
        expect(complexMarkingFig12).toBeTruthy();

        bXorBxbFig13 = parser.parse(`.type pn
.transitions
a A
b1 B
b2 B
b3 B
c C
d D
x X
.places
c1 1
c2 0
c3 0
c4 0
c5 0
c6 0
c7 0
c8 0
.arcs
c1 a 1
a c2 1
a c3 1
c2 b1 1
c2 b2 1
b1 c4 1
c4 x 1
x c5 1
c5 b3 1
b3 c6 1
b2 c6 1
c3 c 1
c c7 1
c6 d 1
c7 d 1
d c8 1`)!;
        expect(bXorBxbFig13).toBeTruthy();

        netFig15b = parser.parse(`.type pn
.transitions
a A
b B
x X
c C
d D
.places
p1 1
p2 0
p8 0
p4 0
p6 0
p7 0
.arcs
p1 a 1
a p2 1
a p4 1
p2 b 1
x p2 1
p4 c 2
b p6 2
p6 x 1
c p7 1
p6 d 1
p7 d 1
d p8 1`)!;
        expect(netFig15b).toBeTruthy();

        arcWeightsFig15b = parser.parse(`.type pn
.transitions
a A
b1 B
b2 B
c C
d D
x1 X
x2 X
.places
c1 1
c2 0
c3 0
c4 0
c5 0
c6 0
c7 0
c8 0
.arcs
c1 a 1
a c2 1
a c3 1
c2 b1 1
b1 c4 2
c4 x1 1
x1 c5 1
c5 b2 1
b2 c6 2
c3 c 2
c c7 1
c6 d 1
c7 d 1
d c8 1
c6 x2 1
x2 c2 1`)!;
        expect(arcWeightsFig15b).toBeTruthy();
    });

    afterEach(() => {
        jasmine.DEFAULT_TIMEOUT_INTERVAL = defaultTimeoutInterval;
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should validate firing sequence', (done) => {
        service.validate(netFig1, firingSequenceFig5).pipe(take(1)).subscribe(r => {
            expect(r.length).toBe(8);
            for (const res of r) {
                expect(res.valid).toBeTrue();
                expect(res.tokenTrail).toBeTruthy();
            }
            done();
        });
    });

    it('should validate state graph', (done) => {
        service.validate(netFig1, stateGraphFig7).pipe(take(1)).subscribe(r => {
            expect(r.length).toBe(8);
            for (const res of r) {
                expect(res.valid).toBeTrue();
                expect(res.tokenTrail).toBeTruthy();
            }
            done();
        })
    });

    it('should validate partial order', (done) => {
        service.validate(netFig1, partialOrderFig10b).pipe(take(1)).subscribe(r => {
            expect(r.length).toBe(8);
            for (const res of r) {
                expect(res.valid).toBeTrue();
                expect(res.tokenTrail).toBeTruthy();
            }
            done();
        })
    });

    it('should validate 3 tokens', (done) => {
        service.validate(netThreeTokens, threeTokensFig12).pipe(take(1)).subscribe(r => {
            expect(r.length).toBe(8);
            for (const res of r) {
                expect(res.valid).toBeTrue();
                expect(res.tokenTrail).toBeTruthy();
            }
            done();
        })
    });

    it('should validate complex initial marking', (done) => {
        service.validate(netComplexMarking, complexMarkingFig12).pipe(take(1)).subscribe(r => {
            expect(r.length).toBe(8);
            for (const res of r) {
                expect(res.valid).toBeTrue();
                expect(res.tokenTrail).toBeTruthy();
            }
            done();
        })
    });

    it('should not validate B xor BXB', (done) => {
        service.validate(netFig1, bXorBxbFig13).pipe(take(1)).subscribe(r => {
            expect(r.length).toBe(8);
            for (const res of r) {
                switch (res.placeId) {
                    case 'p1':
                    case 'p2':
                    case 'p4':
                    case 'p6':
                    case 'p7':
                    case 'p8':
                        expect(res.valid).toBeTrue();
                        expect(res.tokenTrail).toBeTruthy();
                        break;
                    case 'p3':
                    case 'p5':
                        expect(res.valid).toBeFalse();
                        break;
                }
            }
            done();
        })
    });

    it('should validate arc weights', (done) => {
        service.validate(netFig15b, arcWeightsFig15b).pipe(take(1)).subscribe(r => {
            expect(r.length).toBe(6);
            for (const res of r) {
                expect(res.valid).toBeTrue();
                expect(res.tokenTrail).toBeTruthy();
            }
            done();
        })
    });
});
