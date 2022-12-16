import {Observable, ReplaySubject, take} from 'rxjs';
import {GLPK, LP, Result} from 'glpk.js';
import {ConstraintsWithNewVariables} from '../../models/glpk/constraints-with-new-variables';
import {Variable} from '../../models/glpk/variable';
import {IncrementingCounter} from '../incrementing-counter';
import {arraify} from '../arraify';
import {Constraint, MessageLevel} from '../../models/glpk/glpk-constants';
import {Bound} from '../../models/glpk/bound';
import {SubjectTo} from '../../models/glpk/subject-to';
import {ProblemSolution} from '../../models/glpk/problem-solution';


export abstract class IlpSolver {

    // k and K defined as per https://blog.adamfurmanek.pl/2015/09/12/ilp-part-4/
    // for some reason k = 2^19 while not large enough to cause precision problems in either doubles or integers
    // has caused the iterative algorithm to loop indefinitely, presumably because of some precision error in the implementation of the solver
    protected static readonly k = (1 << 10) - 1 // 2^10 - 1
    protected static readonly K = 2 * IlpSolver.k + 1;

    private readonly _constraintCounter: IncrementingCounter;
    private readonly _variableCounter: IncrementingCounter;
    protected _allVariables: Set<string>;

    protected constructor(protected _solver$: Observable<GLPK>) {
        this._constraintCounter = new IncrementingCounter();
        this._variableCounter = new IncrementingCounter();
        this._allVariables = new Set<string>();
    }

    protected applyConstraints(ilp: LP, constraints: ConstraintsWithNewVariables) {
        if (ilp.subjectTo === undefined) {
            ilp.subjectTo = [];
        }
        ilp.subjectTo.push(...constraints.constraints);

        if (ilp.binaries === undefined) {
            ilp.binaries = [];
        }
        ilp.binaries.push(...constraints.binaryVariables);

        if (ilp.generals === undefined) {
            ilp.generals = [];
        }
        ilp.generals.push(...constraints.integerVariables);
    }

    protected combineCoefficients(variables: Array<Variable>): Array<Variable> {
        const map = new Map<string, number>();
        for (const variable of variables) {
            const coef = map.get(variable.name);
            if (coef !== undefined) {
                map.set(variable.name, coef + variable.coef);
            } else {
                map.set(variable.name, variable.coef);
            }
        }

        const result: Array<Variable> = [];
        for (const [name, coef] of map) {
            if (coef === 0) {
                continue;
            }
            result.push(this.variable(name, coef));
        }
        return result;
    }

    protected createVariablesFromPlaceIds(placeIds: Array<string>, coefficient: number): Array<Variable> {
        return placeIds.map(id => this.variable(id, coefficient));
    }

    protected helperVariableName(prefix = 'y'): string {
        let helpVariableName;
        do {
            helpVariableName = `${prefix}${this._variableCounter.next()}`;
        } while (this._allVariables.has(helpVariableName));
        this._allVariables.add(helpVariableName);
        return helpVariableName;
    }

    protected xAbsoluteOfSum(x: string, sum: Array<Variable>): ConstraintsWithNewVariables {
        /*
         * As per https://blog.adamfurmanek.pl/2015/09/19/ilp-part-5/
         *
         * x >= 0
         * (x + sum is 0) or (x - sum is 0) = 1
         *
         */

        const y = this.helperVariableName('yAbsSum'); // x + sum is 0
        const z = this.helperVariableName('zAbsSum'); // x - sym is 0
        const w = this.helperVariableName('wAbsSum'); // y or z

        return ConstraintsWithNewVariables.combineAndIntroduceVariables(
            w, undefined,
            // x >= 0
            this.greaterEqualThan(this.variable(x), 0),
            // w is y or z
            this.xAorB(w, y, z),
            // w is true
            this.equal(this.variable(w), 1),
            // x + sum is 0
            this.xWhenAEqualsB(y, [this.variable(x), ...sum.map(a => this.createOrCopyVariable(a))], 0),
            // x - sum is 0
            this.xWhenAEqualsB(z, [this.variable(x), ...sum.map(a => this.createOrCopyVariable(a, -1))], 0)
        );
    }

    protected xWhenAEqualsB(x: string,
                          a: string | Array<string> | Array<Variable>,
                          b: string | number): ConstraintsWithNewVariables {
        /*
             As per https://blog.adamfurmanek.pl/2015/09/12/ilp-part-4/

             x is a equals b <=> a greater equal than b and a less equal than b
         */

        const y = this.helperVariableName('yWhenEquals');
        const z = this.helperVariableName('zWhenEquals');

        const aGreaterEqualB = this.xWhenAGreaterEqualB(y, a, b);
        const aLessEqualB = this.xWhenALessEqualB(z, a, b);

        return ConstraintsWithNewVariables.combineAndIntroduceVariables(
            [x, y], undefined,
            aGreaterEqualB,
            aLessEqualB,
            this.xAandB(x, y, z),
        );
    }

    protected yWhenAGreaterEqualB(a: string, b: number): ConstraintsWithNewVariables {
        /*
            As per https://blog.adamfurmanek.pl/2015/09/12/ilp-part-4/ and https://blog.adamfurmanek.pl/2015/08/22/ilp-part-1/
            x = a >= b can be defined as !(b > a)
            the negation for binary variables can be expressed as (for x = !y both binary) x = 1 - y
            the 1 - y form can be extracted and added to the constraint that puts all help variables together, therefore we only need to express y = b > a
            for |a|,|b| <= k and K = 2k + 1
            y = b > a can be expressed as:
            a - b + Ky >= 0
            a - b + Ky <= K-1

            in our case b is always a constant given by the solution (region)
            therefore we only have a and y as our variables which gives:
            a + Ky >= b
            a + Ky <= K-1 + b
         */
        const y = this.helperVariableName();

        if (b > IlpSolver.k) {
            console.debug("b", b);
            console.debug("k", IlpSolver.k);
            throw new Error("b > k. This implementation can only handle solutions that are at most k");
        }

        return ConstraintsWithNewVariables.combineAndIntroduceVariables(
            [y], undefined,
            this.greaterEqualThan([this.variable(a), this.variable(y, IlpSolver.K)], b),
            this.lessEqualThan([this.variable(a), this.variable(y, IlpSolver.K)], IlpSolver.K - 1 + b)
        );
    }

    protected xWhenAGreaterEqualB(x: string,
                                a: string | Array<string> | Array<Variable>,
                                b: string | number): ConstraintsWithNewVariables {
        /*
            As per https://blog.adamfurmanek.pl/2015/09/12/ilp-part-4/

            a is greater equal b <=> not a less than b
         */

        const z = this.helperVariableName('zALessB');

        return ConstraintsWithNewVariables.combineAndIntroduceVariables(z, undefined,
            // z when a less than b
            this.xWhenALessB(z, a, b),
            // x not z
            this.xNotA(x, z)
        );
    }

    protected xWhenALessEqualB(x: string,
                             a: string | Array<string> | Array<Variable>,
                             b: string | number): ConstraintsWithNewVariables {
        /*
            As per https://blog.adamfurmanek.pl/2015/09/12/ilp-part-4/

            a is less equal b <=> not a greater than b
         */

        const z = this.helperVariableName('zAGreaterB');

        return ConstraintsWithNewVariables.combineAndIntroduceVariables(z, undefined,
            // z when a greater than b
            this.xWhenAGreaterB(z, a, b),
            // x not z
            this.xNotA(x, z)
        );
    }

    protected xWhenAGreaterB(x: string,
                           a: string | Array<string> | Array<Variable> | number,
                           b: string | Array<string> | Array<Variable> | number): ConstraintsWithNewVariables {
        /*
            As per https://blog.adamfurmanek.pl/2015/09/12/ilp-part-4/
            a,b integer
            |a|,|b| <= k
            k = 2^n - 1, n natural
            K = 2k + 1
            x binary

            0 <= b - a + Kx <= K - 1
         */

        let aIsVariable = false;
        let bIsVariable = false;
        if (typeof a === 'string' || Array.isArray(a)) {
            aIsVariable = true;
            if (typeof a === 'string') {
                a = arraify(a);
            }
        }
        if (typeof b === 'string' || Array.isArray(b)) {
            bIsVariable = true;
            if (typeof b === 'string') {
                b = arraify(b);
            }
        }

        if (aIsVariable && bIsVariable) {
            return ConstraintsWithNewVariables.combine(
                // b - a + Kx >= 0
                this.greaterEqualThan([
                    ...(b as Array<string> | Array<Variable>).map(b => this.createOrCopyVariable(b)),
                    ...(a as Array<string> | Array<Variable>).map(a => this.createOrCopyVariable(a, -1)),
                    this.variable(x, IlpSolver.K)
                ], 0),
                // b - a + Kx <= K - 1
                this.lessEqualThan([
                    ...(b as Array<string> | Array<Variable>).map(b => this.createOrCopyVariable(b)),
                    ...(a as Array<string> | Array<Variable>).map(a => this.createOrCopyVariable(a, -1)),
                    this.variable(x, IlpSolver.K)
                ], IlpSolver.K - 1),
            );
        } else if (aIsVariable && !bIsVariable) {
            return ConstraintsWithNewVariables.combine(
                // -a + Kx >= -b
                this.greaterEqualThan([
                    ...(a as Array<string> | Array<Variable>).map(a => this.createOrCopyVariable(a, -1)),
                    this.variable(x, IlpSolver.K)
                ], -b),
                // -a + Kx <= K - b - 1
                this.lessEqualThan([
                    ...(a as Array<string> | Array<Variable>).map(a => this.createOrCopyVariable(a, -1)),
                    this.variable(x, IlpSolver.K)
                ], IlpSolver.K - (b as number) - 1),
            );
        } else if (!aIsVariable && bIsVariable) {
            return ConstraintsWithNewVariables.combine(
                // b + Kx >= a
                this.greaterEqualThan([
                    ...(b as Array<string> | Array<Variable>).map(b => this.createOrCopyVariable(b)),
                    this.variable(x, IlpSolver.K)
                ], a as number),
                // b + Kx <= K + a - 1
                this.lessEqualThan([
                    ...(b as Array<string> | Array<Variable>).map(b => this.createOrCopyVariable(b)),
                    this.variable(x, IlpSolver.K)
                ], IlpSolver.K + (a as number) - 1),
            );
        } else {
            throw new Error(`unsupported comparison! x when ${a} > ${b}`);
        }
    }

    protected xWhenALessB(x: string,
                        a: string | Array<string> | Array<Variable>,
                        b: string | number): ConstraintsWithNewVariables {
        /*
            As per https://blog.adamfurmanek.pl/2015/09/12/ilp-part-4/

            a is less than b <=> b is greater than a
         */
        return this.xWhenAGreaterB(x, b, a);
    }

    protected xAandB(x: string, a: string, b: string): ConstraintsWithNewVariables {
        /*
            As per http://blog.adamfurmanek.pl/2015/08/22/ilp-part-1/
            a,b,x binary

            0 <= a + b - 2x <= 1
         */
        return ConstraintsWithNewVariables.combine(
            // a + b -2x >= 0
            this.greaterEqualThan([this.variable(a), this.variable(b), this.variable(x, -2)], 0),
            // a + b -2x <= 1
            this.lessEqualThan([this.variable(a), this.variable(b), this.variable(x, -2)], 1)
        );
    }

    protected xAorB(x: string, a: string, b: string): ConstraintsWithNewVariables {
        /*
            As per http://blog.adamfurmanek.pl/2015/08/22/ilp-part-1/
            a,b,x binary

            -1 <= a + b - 2x <= 0
         */
        return ConstraintsWithNewVariables.combine(
            // a + b -2x >= -1
            this.greaterEqualThan([this.variable(a), this.variable(b), this.variable(x, -2)], -1),
            // a + b -2x <= 0
            this.lessEqualThan([this.variable(a), this.variable(b), this.variable(x, -2)], 0)
        );
    }

    protected xNotA(x: string, a: string): ConstraintsWithNewVariables {
        /*
            As per http://blog.adamfurmanek.pl/2015/08/22/ilp-part-1/
            a,x binary

            x = 1 - a
         */
        // x + a = 1
        return this.equal([this.variable(x), this.variable(a)], 1);
    }

    private createOrCopyVariable(original: string | Variable, coefficient: number = 1): Variable {
        if (typeof original === 'string') {
            return this.variable(original, coefficient);
        } else {
            return this.variable(original.name, original.coef * coefficient);
        }
    }

    protected variable(name: string, coefficient: number = 1): Variable {
        return {name, coef: coefficient};
    }

    protected equal(variables: Variable | Array<Variable>, value: number): ConstraintsWithNewVariables {
        console.debug(`${this.formatVariableList(variables)} = ${value}`);
        return new ConstraintsWithNewVariables(this.constrain(
            arraify(variables),
            {type: Constraint.FIXED_VARIABLE, ub: value, lb: value}
        ));
    }

    protected greaterEqualThan(variables: Variable | Array<Variable>, lowerBound: number): ConstraintsWithNewVariables {
        console.debug(`${this.formatVariableList(variables)} >= ${lowerBound}`);
        return new ConstraintsWithNewVariables(this.constrain(
            arraify(variables),
            {type: Constraint.LOWER_BOUND, ub: 0, lb: lowerBound}
        ));
    }

    protected lessEqualThan(variables: Variable | Array<Variable>, upperBound: number): ConstraintsWithNewVariables {
        console.debug(`${this.formatVariableList(variables)} <= ${upperBound}`);
        return new ConstraintsWithNewVariables(this.constrain(
            arraify(variables),
            {type: Constraint.UPPER_BOUND, ub: upperBound, lb: 0}
        ));
    }

    protected sumEqualsZero(...variables: Array<Variable>): ConstraintsWithNewVariables {
        return this.equal(variables, 0);
    }

    protected sumGreaterThan(variables: Array<Variable>, lowerBound: number): ConstraintsWithNewVariables {
        return this.greaterEqualThan(variables, lowerBound + 1);
    }

    private constrain(vars: Array<Variable>, bnds: Bound): SubjectTo {
        return {
            name: this.constraintName(),
            vars,
            bnds
        };
    }

    private constraintName(): string {
        return 'c' + this._constraintCounter.next();
    }

    protected solveILP(ilp: LP): Observable<ProblemSolution> {
        const result$ = new ReplaySubject<ProblemSolution>();

        this._solver$.pipe(take(1)).subscribe(glpk => {
            const res = glpk.solve(ilp, {
                msglev: MessageLevel.ERROR,
            }) as unknown as Promise<Result>;
            res.then((solution: Result) => {
                result$.next({ilp, solution});
                result$.complete();
            })
        });

        return result$.asObservable();
    }

    private formatVariableList(variables: Variable | Array<Variable>): string {
        return arraify(variables).map(v => `${v.coef > 0 ? '+' : ''}${v.coef === -1 ? '-' : (v.coef === 1 ? '' : v.coef)}${v.name}`).join(' ');
    }
}
