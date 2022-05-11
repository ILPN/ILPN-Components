import {Injectable} from '@angular/core';
import {IncrementingCounter} from '../../../utility/incrementing-counter';
import {BehaviorSubject, Observable, ReplaySubject, switchMap, take} from 'rxjs';
import {GLPK, LP, Result} from 'glpk.js';
import {PetriNet} from '../../../models/pn/model/petri-net';
import {ProblemSolution} from './problem-solution';
import {Constraint, Goal, MessageLevel, Solution} from '../../../models/glpk/glpk-constants';
import {SubjectTo} from '../../../models/glpk/subject-to';
import {Arc} from '../../../models/pn/model/arc';
import {Transition} from '../../../models/pn/model/transition';
import {Variable} from '../../../models/glpk/variable';
import {NewVariableWithConstraint} from './new-variable-with-constraint';
import {Bound} from '../../../models/glpk/bound';
import {PetriNetRegionTransformerService} from './petri-net-region-transformer.service';

@Injectable({
    providedIn: 'root'
})
export class PetriNetRegionsService {

    // k and K defined as per https://blog.adamfurmanek.pl/2015/09/12/ilp-part-4/
    // for some reason k = 2^19 while not large enough to cause precision problems in either doubles or integers
    // has caused the iterative algorithm to loop indefinitely, presumably because of some precision error in the implementation of the solver
    private static readonly k = (1 << 10) - 1 // 2^10 - 1
    private static readonly K = 2 * PetriNetRegionsService.k + 1;

    private readonly _constraintCounter: IncrementingCounter;
    private readonly _variableCounter: IncrementingCounter;
    private readonly _solver: ReplaySubject<GLPK>;
    private _allVariables: Set<string>;
    private _placeVariables: Set<string>;

    constructor(private _regionTransformer: PetriNetRegionTransformerService) {
        this._constraintCounter = new IncrementingCounter();
        this._variableCounter = new IncrementingCounter();
        this._solver = new ReplaySubject<GLPK>(1);
        this._allVariables = new Set<string>();
        this._placeVariables = new Set<string>();

        // get the solver object
        const promise = import('glpk.js');
        promise.then(result => {
            // @ts-ignore
            result.default().then(glpk => {
                this._solver.next(glpk);
            });
        });
    }

    public computeRegions(net: PetriNet, oneBound: boolean): Observable<PetriNet> {
        const regions$ = new ReplaySubject<PetriNet>();

        const ilp$ = new BehaviorSubject(this.setUpInitialILP(net, oneBound));
        ilp$.pipe(switchMap(ilp => this.solveILP(ilp))).subscribe((ps: ProblemSolution) => {
            if (ps.solution.result.status === Solution.OPTIMAL) {
                const region = this._regionTransformer.displayRegionInNet(ps.solution, net);

                // TODO check if the region is new and we are not trapped in a loop

                regions$.next(region);
                ilp$.next(this.addConstraintsToILP(ps));
            } else {
                // we are done, there are no more regions
                console.debug('final non-optimal result', ps.solution);
                regions$.complete();
                ilp$.complete();
            }
        });

        return regions$.asObservable();
    }

    private setUpInitialILP(net: PetriNet, oneBound: boolean): LP {
        this._placeVariables = new Set(net.getPlaces().map(p => p.id));
        this._allVariables = new Set<string>(this._placeVariables);

        const initial: LP = {
            name: 'ilp',
            objective: {
                name: 'region',
                direction: Goal.MINIMUM,
                vars: net.getPlaces().map(p => this.variable(p.id))
            },
            subjectTo: this.createInitialConstraints(net),
        };

        initial[oneBound ? 'binaries' : 'generals'] = Array.from(this._placeVariables);

        return initial;
    }

    private createInitialConstraints(net: PetriNet): Array<SubjectTo> {
        const result: Array<SubjectTo> = [];
        // only non-negative solutions
        result.push(...net.getPlaces().map(p => this.greaterEqualThan(this.variable(p.id), 0)));

        // non-zero solutions
        result.push(this.greaterEqualThan(net.getPlaces().map(p => this.variable(p.id)), 1));

        // initial markings must be the same
        const startingPlaces = net.getPlaces().filter(p => p.ingoingArcs.length == 0);
        if (startingPlaces.length > 1) {
            const p1 = startingPlaces.splice(0, 1)[0];
            for (const p2 of startingPlaces) {
                result.push(this.sumEqualsZero(this.variable(p1.id, 1), this.variable(p2.id, -1)));
            }
        }

        // gradient constraints
        const labels = this.collectTransitionByLabel(net);
        for (const [key, transitions] of labels.entries()) {
            if (transitions.length === 1) {
                continue;
            }

            const t1 = transitions.splice(0, 1)[0];
            for (const t2 of transitions) {
                // t1 post-set
                let variables = this.createVariablesFromPlaceIds(t1.outgoingArcs.map((a: Arc) => a.destinationId), 1);
                // t1 pre-set
                variables.push(...this.createVariablesFromPlaceIds(t1.ingoingArcs.map((a: Arc) => a.sourceId), -1));
                // t2 post-set
                variables.push(...this.createVariablesFromPlaceIds(t2.outgoingArcs.map((a: Arc) => a.destinationId), -1));
                // t2 pre-set
                variables.push(...this.createVariablesFromPlaceIds(t2.ingoingArcs.map((a: Arc) => a.sourceId), 1));

                variables = this.combineCoefficients(variables);

                result.push(this.sumEqualsZero(...variables));
            }
        }

        return result;
    }

    private addConstraintsToILP(ps: ProblemSolution): LP {
        const ilp = ps.ilp;

        // no region that contains the new solution as subset
        const region = ps.solution.result.vars;
        const regionPlaces = Object.entries(region).filter(([k, v]) => v != 0 && this._placeVariables.has(k));
        const binaryGeqConstraints = regionPlaces.map(([k, v]) => this.introduceHelpVariable(k, v));

        const helpVariables: Array<string> = [];
        for (const variableWithConstraints of binaryGeqConstraints) {
            helpVariables.push(variableWithConstraints.id);
            ilp.subjectTo.push(...variableWithConstraints.constraints);
        }

        if (ilp.binaries === undefined) {
            ilp.binaries = [];
        }
        ilp.binaries.push(...helpVariables);
        /*
            Sum of x-es should be less than their number
            x = 1 - y
            Therefore sum of y should be greater than 0
         */
        ilp.subjectTo.push(this.sumGreaterThan(helpVariables.map(y => this.variable(y)), 0));

        console.debug('solution', ps.solution.result.vars);
        console.debug('non-zero', regionPlaces);
        console.debug('additional constraint', ilp.subjectTo[ilp.subjectTo.length - 1]);

        return ilp;
    }

    private collectTransitionByLabel(net: PetriNet): Map<string, Array<Transition>> {
        const result = new Map<string, Array<Transition>>();
        for (const t of net.getTransitions()) {
            if (t.label === undefined) {
                throw new Error(`Transition with id '${t.id}' has no label! All transitions must be labeled in the input net!`);
            }
            const array = result.get(t.label);
            if (array === undefined) {
                result.set(t.label, [t]);
            } else {
                array.push(t);
            }
        }
        return result;
    }

    private createVariablesFromPlaceIds(placeIds: Array<string>, coefficient: number): Array<Variable> {
        return placeIds.map(id => this.variable(id, coefficient));
    }

    private combineCoefficients(variables: Array<Variable>): Array<Variable> {
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

    private introduceHelpVariable(place: string, solution: number): NewVariableWithConstraint {
        let helpVariableName;
        do {
            helpVariableName = `y${this._variableCounter.next()}`;
        } while (this._allVariables.has(helpVariableName));
        this._allVariables.add(helpVariableName);

        const constrains = this.yWhenAGreaterEqualB(helpVariableName, place, solution);
        return new NewVariableWithConstraint(helpVariableName, constrains);
    }

    private yWhenAGreaterEqualB(y: string, a: string, b: number): Array<SubjectTo> {
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
        if (b > PetriNetRegionsService.k) {
            console.debug("b", b);
            console.debug("k", PetriNetRegionsService.k);
            throw new Error("b > k. This implementation can only handle solutions that are at most k");
        }

        return [
            this.greaterEqualThan([this.variable(a), this.variable(y, PetriNetRegionsService.K)], b),
            this.lessEqualThan([this.variable(a), this.variable(y, PetriNetRegionsService.K)], PetriNetRegionsService.K - 1 + b)
        ];
    }

    private variable(name: string, coefficient: number = 1): Variable {
        return {name, coef: coefficient};
    }

    private greaterEqualThan(variables: Variable | Array<Variable>, lowerBound: number): SubjectTo {
        return this.constrain(
            Array.isArray(variables) ? variables : [variables],
            {type: Constraint.LOWER_BOUND, ub: 0, lb: lowerBound}
        );
    }

    private lessEqualThan(variables: Array<Variable>, upperBound: number): SubjectTo {
        return this.constrain(
            variables,
            {type: Constraint.UPPER_BOUND, ub: upperBound, lb: 0}
        );
    }

    private sumEqualsZero(...variables: Array<Variable>): SubjectTo {
        return this.constrain(
            variables,
            {type: Constraint.FIXED_VARIABLE, ub: 0, lb: 0}
        );
    }

    private sumGreaterThan(variables: Array<Variable>, lowerBound: number): SubjectTo {
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

    private solveILP(ilp: LP): Observable<ProblemSolution> {
        const result$ = new ReplaySubject<ProblemSolution>();

        this._solver.asObservable().pipe(take(1)).subscribe(glpk => {
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
}
