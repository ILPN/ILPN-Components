import {TestBed} from '@angular/core/testing';
import {PartialOrderIsomorphismService} from './partial-order-isomorphism.service';
import {PartialOrder} from "../../../models/po/model/partial-order";
import {PartialOrderParserService} from "../../../models/po/parser/partial-order-parser.service";
import {expect} from "@angular/flex-layout/_private-utils/testing";

describe('PartialOrderIsomorphismService', () => {
    let isomorphismService: PartialOrderIsomorphismService;
    let parserService: PartialOrderParserService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        isomorphismService = TestBed.inject(PartialOrderIsomorphismService);
        parserService = TestBed.inject(PartialOrderParserService);
    });

    it('should be created', () => {
        expect(isomorphismService).toBeTruthy();
    });

    it('empty PO isomorphic', () => {
        expect(isomorphismService.arePartialOrdersIsomorphic(new PartialOrder(), new PartialOrder())).toBeTrue();
    });

    it ('A B parallel PO is isomorphic', () => {
        const po1 = parserService.parse(
            `.type po
.events
a A
b B
.arcs`
        );
        expect(po1).toBeDefined();
        const po2 = parserService.parse(
            `.type po
.events
b B
a A
.arcs`
        );
        expect(po2).toBeDefined();
        expect(isomorphismService.arePartialOrdersIsomorphic(po1!, po2!)).toBeTrue();
    });

    it ('3A sequence PO is isomorphic', () => {
        const po1 = parserService.parse(
            `.type po
.events
a A
b A
c A
.arcs
a b
b c`
        );
        expect(po1).toBeDefined();
        const po2 = parserService.parse(
            `.type po
.events
b A
a A
c A
.arcs
a c
c b`
        );
        expect(po2).toBeDefined();
        expect(isomorphismService.arePartialOrdersIsomorphic(po1!, po2!)).toBeTrue();
    });

    it ('AB then C is not C then AB', () => {
        const po1 = parserService.parse(
            `.type po
.events
a A
b B
c C
.arcs
a c
b c`
        );
        expect(po1).toBeDefined();
        const po2 = parserService.parse(
            `.type po
.events
a A
b B
c C
.arcs
c a
c b`
        );
        expect(po2).toBeDefined();
        expect(isomorphismService.arePartialOrdersIsomorphic(po1!, po2!)).toBeFalse();
    });

    it('repair example partial orders bug', () => {
        // from Petri nets isomorphism service tests
        const po1 = parserService.parse(
            `.type po
.events
t0 Register
t1 Analyze_Defect
t2 Inform_User
t3 Repair_Complex
t4 Test_Repair
t5 Archive_Repair
.arcs
t0 t1
t1 t2
t3 t4
t4 t5
t1 t3
t2 t5`
        );
        expect(po1).toBeTruthy();
        const po2 = parserService.parse(
            `.type po
.events
t0 Register
t1 Analyze_Defect
t2 Repair_Complex
t3 Test_Repair
t4 Inform_User
t5 Archive_Repair
.arcs
t0 t1
t1 t2
t2 t3
t4 t5
t3 t5
t1 t4
`
        );
        expect(po2).toBeTruthy();
        expect(isomorphismService.arePartialOrdersIsomorphic(po1!, po2!)).toBeTrue();
    })

    it('check po size bug', () => {
        const po1 = parserService.parse(
            `.type po
.events
r Register
a Analyze_Defect
i Inform_User
s Repair_Simple
t Test_Repair
ch Archive_Repair
.arcs
r a
a i
a s
s t
i ch
t ch`
        );
        expect(po1).toBeTruthy();
        const po2 = parserService.parse(
            `.type po
.events
r Register
a Analyze_Defect
i Inform_User
s1 Repair_Simple
t1 Test_Repair
s2 Repair_Simple
t2 Test_Repair
x Restart_Repair
ch Archive_Repair
.arcs
r a
a i
a s1
s1 t1
t1 x
x s2
s2 t2
t2 ch
i ch
`
        );
        expect(po2).toBeTruthy();
        expect(isomorphismService.arePartialOrdersIsomorphic(po1!, po2!)).toBeFalse();
    })
});
