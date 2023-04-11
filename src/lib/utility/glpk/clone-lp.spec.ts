import {LP} from "glpk.js";
import {Constraint, Goal} from "../../models/glpk/glpk-constants";
import {cloneLP} from "./clone-lp";


describe('Clone LP', () => {
    it('should clone LP', () => {
        const original: LP = {
            name: 'name',
            objective: {
                direction: Goal.MINIMUM,
                name: 'objective',
                vars: [
                    {name: 'x', coef: 1},
                    {name: 'y', coef: -2}
                ]
            },
            subjectTo: [
                {
                    name: 'constraint1',
                    vars: [
                        {name: 'x', coef: 2}
                    ],
                    bnds: {
                        type: Constraint.UPPER_BOUND,
                        ub: 5,
                        lb: 0
                    }
                },
                {
                    name: 'constraint2',
                    vars: [
                        {name: 'y', coef: 1}
                    ],
                    bnds: {
                        type: Constraint.DOUBLE_BOUND,
                        ub: 3,
                        lb: 1
                    }
                },
            ],
            generals: ['x', 'y']
        };

        const clone = cloneLP(original);

        expect(clone).toBeTruthy();
        expect(clone).not.toBe(original);
        expect(clone.name).toBeDefined();
        expect(clone.name).toBe(original.name);

        expect(clone.objective).toBeDefined();
        expect(clone.objective).not.toBe(original.objective);
        expect(clone.objective.direction).toBeDefined();
        expect(clone.objective.direction).toBe(original.objective.direction);
        expect(clone.objective.name).toBeDefined();
        expect(clone.objective.name).toBe(original.objective.name);
        expect(clone.objective.vars).toBeDefined();
        expect(clone.objective.vars).not.toBe(original.objective.vars);
        expect(Array.isArray(clone.objective.vars)).toBeTrue();
        expect(clone.objective.vars.length).toBe(original.objective.vars.length);
        for (let i = 0; i < original.objective.vars.length; i++) {
            const o = original.objective.vars[i];
            const c = clone.objective.vars[i];
            expect(c).not.toBe(o);
            expect(c.name).toBeDefined();
            expect(c.name).toBe(o.name);
            expect(c.coef).toBeDefined()
        }

        expect(clone.subjectTo).toBeDefined();
        expect(clone.subjectTo).not.toBe(original.subjectTo);
        expect(Array.isArray(clone.subjectTo)).toBeTrue();
        expect(clone.subjectTo.length).toBe(original.subjectTo.length);
        for (let i = 0; i < original.subjectTo.length; i++) {
            const ost = original.subjectTo[i];
            const cst = clone.subjectTo[i];
            expect(cst).not.toBe(ost);
            expect(cst.name).toBeDefined();
            expect(cst.name).toBe(ost.name);
            expect(cst.vars).toBeDefined();
            expect(cst.vars).not.toBe(ost.vars);
            expect(Array.isArray(cst.vars)).toBeTrue();
            expect(cst.vars.length).toBe(ost.vars.length);
            for (let j = 0; j < cst.vars.length; j++) {
                const ov = ost.vars[j];
                const cv = cst.vars[j];
                expect(cv).not.toBe(ov);
                expect(cv.name).toBeDefined();
                expect(cv.name).toBe(ov.name);
                expect(cv.coef).toBeDefined();
                expect(cv.coef).toBe(ov.coef);
            }
            expect(cst.bnds).toBeDefined();
            expect(cst.bnds).not.toBe(ost.bnds);
            expect(cst.bnds.type).toBeDefined();
            expect(cst.bnds.type).toBe(ost.bnds.type);
            expect(cst.bnds.ub).toBeDefined();
            expect(cst.bnds.ub).toBe(ost.bnds.ub);
            expect(cst.bnds.lb).toBeDefined();
            expect(cst.bnds.lb).toBe(ost.bnds.lb);
        }

        expect(clone.generals).toBeDefined();
        expect(clone.generals).not.toBe(original.generals);
        expect(Array.isArray(clone.generals)).toBeTrue();
        expect(clone.generals?.length).toBe(original.generals?.length);
        for (let i = 0; i < original.generals!.length; i++) {
            const o = original.generals![i];
            const c = clone.generals![i];
            expect(c).toBe(o);
        }

        expect(clone.binaries).not.toBeDefined();
    });
});
