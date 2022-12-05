import {TestBed} from '@angular/core/testing';
import {PetriNetIsomorphismService} from './petri-net-isomorphism.service';
import {expect} from '@angular/flex-layout/_private-utils/testing';
import {PetriNet} from '../../../models/pn/model/petri-net';
import {PetriNetParserService} from '../../../models/pn/parser/petri-net-parser.service';

describe('PetriNetIsomorphismService', () => {
    let isomorphismService: PetriNetIsomorphismService;
    let parserService: PetriNetParserService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        isomorphismService = TestBed.inject(PetriNetIsomorphismService);
        parserService = TestBed.inject(PetriNetParserService);
    });

    it('should be created', () => {
        expect(isomorphismService).toBeTruthy();
    });

    it('empty net isomorphic', () => {
        expect(isomorphismService.arePartialOrderPetriNetsIsomorphic(new PetriNet(), new PetriNet())).toBeTrue();
        expect(isomorphismService.arePetriNetsIsomorphic(new PetriNet(), new PetriNet())).toBeTrue();
    });

    it('A B parallel PO is isomorphic', () => {
        const po1 = parserService.parse(
            `.type pn
.transitions
a A
b B
.places
p1 0
p2 0
p3 0
p4 0
.arcs
p1 a
a p2
p3 b
b p4`
        );
        expect(po1).toBeTruthy();
        const po2 = parserService.parse(
            `.type pn
.transitions
b A
a B
.places
p1 0
p2 0
p3 0
p4 0
.arcs
p1 a
a p2
p3 b
b p4`
        );
        expect(po2).toBeTruthy();
        expect(isomorphismService.arePartialOrderPetriNetsIsomorphic(po1!, po2!)).toBeTrue();
        expect(isomorphismService.arePetriNetsIsomorphic(po1!, po2!)).toBeTrue();
    });

    it('3A sequence PO is isomorphic', () => {
        const po1 = parserService.parse(
            `.type pn
.transitions
a A
b A
c A
.places
p1 0
p2 0
p3 0
p4 0
.arcs
p1 a
a p2
p2 b
b p3
p3 c
c p4`
        );
        expect(po1).toBeTruthy();
        const po2 = parserService.parse(
            `.type pn
.transitions
b A
a A
c A
.places
p1 0
p2 0
p3 0
p4 0
.arcs
p1 a
a p2
p2 b
b p3
p3 c
c p4`
        );
        expect(po2).toBeTruthy();
        expect(isomorphismService.arePartialOrderPetriNetsIsomorphic(po1!, po2!)).toBeTrue();
        expect(isomorphismService.arePetriNetsIsomorphic(po1!, po2!)).toBeTrue();
    });

    it('AB then C is not C then AB PO', () => {
        const po1 = parserService.parse(
            `.type pn
.transitions
a A
b B
c C
.places
p1 0
p2 0
p3 0
p4 0
p5 0
.arcs
p1 a
a p2
p2 c
p3 b
b p4
p4 c
c p5`
        );
        expect(po1).toBeTruthy();
        const po2 = parserService.parse(
            `.type pn
.transitions
a A
b B
c C
.places
p1 0
p2 0
p3 0
p4 0
p5 0
.arcs
p1 c
c p2
c p3
p2 a
a p4
p3 b
b p5`
        );
        expect(po2).toBeTruthy();
        expect(isomorphismService.arePartialOrderPetriNetsIsomorphic(po1!, po2!)).toBeFalse();
        expect(isomorphismService.arePetriNetsIsomorphic(po1!, po2!)).toBeFalse();
    });

    it('A B conflict is isomorphic', () => {
        const po1 = parserService.parse(
            `.type pn
.transitions
a A
b B
.places
p1 0
p2 0
.arcs
p1 a
a p2
p1 b
b p2`
        );
        expect(po1).toBeTruthy();
        const po2 = parserService.parse(
            `.type pn
.transitions
a A
b B
.places
p1 0
p2 0
.arcs
p1 a
a p2
p1 b
b p2`
        );
        expect(po2).toBeTruthy();
        expect(isomorphismService.arePetriNetsIsomorphic(po1!, po2!)).toBeTrue();
    });

    it('unlabeled loop is isomorphic', () => {
        const po1 = parserService.parse(
            `.type pn
.transitions
a
b
.places
p1 0
p2 0
.arcs
p1 a
a p2
p2 b
b p1`
        );
        expect(po1).toBeTruthy();
        const po2 = parserService.parse(
            `.type pn
.transitions
b
a
.places
p1 0
p2 0
.arcs
p1 a
a p2
p2 b
b p1`
        );
        expect(po2).toBeTruthy();
        expect(isomorphismService.arePetriNetsIsomorphic(po1!, po2!)).toBeTrue();
    });

    it('considers arc weights', () => {
        const po1 = parserService.parse(
            `.type pn
.transitions
a
.places
p1 0
.arcs
p1 a`
        );
        expect(po1).toBeTruthy();
        const po2 = parserService.parse(
            `.type pn
.transitions
a
.places
p1 0
.arcs
p1 a 2`
        );
        expect(po2).toBeTruthy();
        expect(isomorphismService.arePetriNetsIsomorphic(po1!, po2!)).toBeFalse();
    });

    it('prime miner incorrect mapping counter incrementation bug', () => {
        const po1 = parserService.parse(
            `.type pn
.transitions
Register Register
Analyze_Defect Analyze_Defect
Repair_Complex Repair_Complex
Test_Repair Test_Repair
Inform_User Inform_User
Archive_Repair Archive_Repair
Repair_Simple Repair_Simple
Restart_Repair Restart_Repair
.places
p0 0
p1 0
p2 1
p3 0
p4 0
p5 0
p6 0
p7 0
p8 0
p9 0
.arcs
Archive_Repair p0
Register p1
p1 Analyze_Defect
p2 Register
Inform_User p3
p3 Archive_Repair
Analyze_Defect p4
p4 Inform_User
Test_Repair p5
p5 Archive_Repair
p5 Restart_Repair
Repair_Complex p6
p6 Test_Repair
Repair_Simple p6
Analyze_Defect p7
p7 Repair_Complex
p7 Repair_Simple
Restart_Repair p7
Analyze_Defect p8
p8 Archive_Repair
Analyze_Defect p9
p9 Restart_Repair`
        );
        expect(po1).toBeTruthy();
        const po2 = parserService.parse(
            `.type pn
.transitions
Register Register
Analyze_Defect Analyze_Defect
Repair_Complex Repair_Complex
Test_Repair Test_Repair
Inform_User Inform_User
Archive_Repair Archive_Repair
Repair_Simple Repair_Simple
Restart_Repair Restart_Repair
.places
p0 0
p1 0
p2 0
p3 0
p4 1
p5 0
p6 0
p7 0
p8 0
p9 0
.arcs
Archive_Repair p0
Inform_User p1
p1 Archive_Repair
Analyze_Defect p2
p2 Inform_User
Register p3
p3 Analyze_Defect
p4 Register
Analyze_Defect p5
p5 Archive_Repair
Repair_Complex p6
p6 Test_Repair
Repair_Simple p6
Test_Repair p7
p7 Archive_Repair
p7 Restart_Repair
Analyze_Defect p8
p8 Repair_Complex
p8 Repair_Simple
Restart_Repair p8
Analyze_Defect p9 2
p9 Restart_Repair`
        );
        expect(po2).toBeTruthy();
        expect(isomorphismService.arePetriNetsIsomorphic(po1!, po2!)).toBeFalse();
    });

    it('repair example partial orders bug', () => {
        const po1 = parserService.parse(
            `.type pn
.frequency 328
.transitions
t0 Register
t1 Analyze_Defect
t2 Inform_User
t3 Repair_Complex
t4 Test_Repair
t5 Archive_Repair
.places
p0 0
p1 0
p2 0
p4 0
p5 0
p6 0
p9 0
p12 0
.arcs
p0 t0
t0 p1
p1 t1
t1 p2
p2 t2
t3 p4
p4 t4
t4 p5
p5 t5
t5 p6
t1 p9
p9 t3
p12 t5
t2 p12`
        );
        expect(po1).toBeTruthy();
        const po2 = parserService.parse(
            `.type pn
.frequency 129
.transitions
t0 Register
t1 Analyze_Defect
t2 Repair_Complex
t3 Test_Repair
t4 Inform_User
t5 Archive_Repair
.places
p0 0
p1 0
p2 0
p3 0
p5 0
p6 0
p10 0
p11 0
.arcs
p0 t0
t0 p1
p1 t1
t1 p2
p2 t2
t2 p3
p3 t3
t4 p5
p5 t5
t5 p6
p10 t5
t3 p10
t1 p11
p11 t4
`
        );
        expect(po2).toBeTruthy();
        expect(isomorphismService.arePartialOrderPetriNetsIsomorphic(po1!, po2!)).toBeTrue();
        expect(isomorphismService.arePetriNetsIsomorphic(po1!, po2!)).toBeTrue();
    });

    it('getIsomorphismMapping', () => {
        expect('Tests for getIsomorphismMapping method').toBe('written');
    });
});
