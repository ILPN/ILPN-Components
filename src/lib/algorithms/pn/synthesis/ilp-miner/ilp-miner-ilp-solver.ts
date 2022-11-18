import {IlpSolver} from '../../../../utility/glpk/abstract-ilp-solver';
import {concatMap, from, Observable, toArray} from 'rxjs';
import {GLPK, LP} from 'glpk.js';
import {Trace} from '../../../../models/log/model/trace';
import {
    TraceMultisetEquivalentStateTraverser
} from '../../../../utility/multiset/trace-multiset-equivalent-state-traverser';
import {SubjectTo} from '../../../../models/glpk/subject-to';
import {MapSet} from '../../../../utility/map-set';
import {mapMultiset, Multiset} from '../../../../utility/multiset/multiset';
import {ConstraintsWithNewVariables} from '../../../../models/glpk/constraints-with-new-variables';
import {Variable} from '../../../../models/glpk/variable';
import {Goal} from '../../../../models/glpk/glpk-constants';
import {SolutionVariable} from './model/solution-variable';
import {ProblemSolution} from '../../../../models/glpk/problem-solution';
import {VariableType} from './model/variable-type';


export class IlpMinerIlpSolver extends IlpSolver {

    private static readonly INITIAL_MARKING = 'm0';
    private static readonly INGOING_ARC_WEIGHT_PREFIX = 'y';
    private static readonly OUTGOING_ARC_WEIGHT_PREFIX = 'x';

    private readonly _labelVariableMapIngoing: Map<string, string>;
    private readonly _labelVariableMapOutgoing: Map<string, string>;
    private readonly _inverseLabelVariableMapIngoing: Map<string, string>;
    private readonly _inverseLabelVariableMapOutgoing: Map<string, string>;

    constructor(solver$: Observable<GLPK>) {
        super(solver$);
        this._labelVariableMapIngoing = new Map<string, string>();
        this._labelVariableMapOutgoing = new Map<string, string>();
        this._inverseLabelVariableMapIngoing = new Map<string, string>();
        this._inverseLabelVariableMapOutgoing = new Map<string, string>();
    }

    public findSolutions(log: Array<Trace>): Observable<Array<ProblemSolution>> {
        const baseIlpConstraints: Array<SubjectTo> = [];
        const directlyFollows = new MapSet<string, string>();

        const traverser = new TraceMultisetEquivalentStateTraverser();
        traverser.traverseMultisetEquivalentStates(log,
            (prefix, step) => {
                baseIlpConstraints.push(...this.firingRule(prefix, step).constraints);
            },
            (prefix, step) => {
                if (prefix.length === 0) {
                    return;
                }
                directlyFollows.add(step, prefix[prefix.length - 1]);
            }
        );

        const oneWayDirectlyFollowsPairs = [];
        for (const entry of directlyFollows.entries()) {
            const second = entry[0];
            for (const first of entry[1]) {
                if (!directlyFollows.has(first, second)) {
                    oneWayDirectlyFollowsPairs.push([first, second]);
                }
            }
        }

        const baseIlp = this.setUpBaseIlp();

        const problems = oneWayDirectlyFollowsPairs.map(pair => ({
            baseIlpConstraints,
            baseIlp,
            pair
        }));

        return from(problems).pipe(
            concatMap(problem => {
                return this.solveILP(this.populateIlp(problem.baseIlp, problem.baseIlpConstraints, problem.pair));
            }),
            toArray()
        );
    }

    private firingRule(prefix: Multiset, step: string): ConstraintsWithNewVariables {
        let foundStep = false;
        const variables = mapMultiset<Array<Variable>>(prefix, (name, cardinality) => {
            const result = [this.variable(this.transitionVariableName(name, IlpMinerIlpSolver.OUTGOING_ARC_WEIGHT_PREFIX), cardinality)];
            let c = cardinality;
            if (name === step) {
                c += 1;
                foundStep = true;
            }
            result.push(this.variable(this.transitionVariableName(name, IlpMinerIlpSolver.INGOING_ARC_WEIGHT_PREFIX), c));
            return result;
        }).reduce((accumulator, value) => accumulator.concat(value), []);

        if (!foundStep) {
            variables.push(this.variable(this.transitionVariableName(step, IlpMinerIlpSolver.INGOING_ARC_WEIGHT_PREFIX), -1));
        }

        variables.push(this.variable(IlpMinerIlpSolver.INITIAL_MARKING));

        return this.greaterEqualThan(variables, 0);
    }

    private transitionVariableName(label: string, prefix: 'x' | 'y'): string {
        let map, inverseMap;
        if (prefix === IlpMinerIlpSolver.INGOING_ARC_WEIGHT_PREFIX) {
            map = this._labelVariableMapIngoing;
            inverseMap = this._inverseLabelVariableMapIngoing;
        } else {
            map = this._labelVariableMapOutgoing;
            inverseMap = this._inverseLabelVariableMapOutgoing;
        }
        const saved = map.get(label);
        if (saved !== undefined) {
            return saved;
        }
        const name = this.helperVariableName(prefix);
        map.set(label, name);
        inverseMap.set(name, label);
        return name;
    }

    private setUpBaseIlp(): LP {
        const allVariables = Array.from(this._allVariables).concat(IlpMinerIlpSolver.INITIAL_MARKING);
        return {
            name: 'ilp',
            objective: {
                name: 'goal',
                direction: Goal.MINIMUM,
                vars: allVariables.map(v => {
                    const coef = v.startsWith(IlpMinerIlpSolver.OUTGOING_ARC_WEIGHT_PREFIX) ? -1 : 1;
                    return this.variable(v, coef);
                })
            },
            subjectTo: [],
            // TODO enable arc weights with a config setting?
            binaries: allVariables
        };
    }

    private populateIlp(baseIlp: LP, baseConstraints: Array<SubjectTo>, causalPair: Array<string>): LP {
        const result = Object.assign({}, baseIlp);
        result.subjectTo = [...baseConstraints];
        result.subjectTo = result.subjectTo.concat(this.greaterEqualThan(this.variable(this.transitionVariableName(causalPair[0], IlpMinerIlpSolver.OUTGOING_ARC_WEIGHT_PREFIX)), 1).constraints);
        result.subjectTo = result.subjectTo.concat(this.greaterEqualThan(this.variable(this.transitionVariableName(causalPair[1], IlpMinerIlpSolver.INGOING_ARC_WEIGHT_PREFIX)), 1).constraints);
        return result;
    }

    public getInverseVariableMapping(variable: string): SolutionVariable {
        if (variable === IlpMinerIlpSolver.INITIAL_MARKING) {
            return {
                label: IlpMinerIlpSolver.INITIAL_MARKING,
                type: VariableType.INITIAL_MARKING
            }
        } else if (variable.startsWith(IlpMinerIlpSolver.INGOING_ARC_WEIGHT_PREFIX)) {
            const label = this._inverseLabelVariableMapIngoing.get(variable);
            if (label === undefined) {
                throw new Error(`ILP variable '${variable}' could not be resolved to an ingoing transition label!`);
            }
            return {
                label,
                type: VariableType.INGOING_WEIGHT
            }
        } else {
            const label = this._inverseLabelVariableMapOutgoing.get(variable);
            if (label === undefined) {
                throw new Error(`ILP variable '${variable}' could not be resolved to an outgoing transition label!`);
            }
            return {
                label,
                type: VariableType.OUTGOING_WEIGHT
            }
        }
    }
}
