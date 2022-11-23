import {ArcWeightIlpSolver} from '../../../../utility/glpk/ArcWeightIlpSolver';
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
import {ProblemSolution} from '../../../../models/glpk/problem-solution';
import {VariableName} from '../../../../utility/glpk/model/variable-name';


export class IlpMinerIlpSolver extends ArcWeightIlpSolver {

    constructor(solver$: Observable<GLPK>) {
        super(solver$);
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
            const result = [this.variable(this.transitionVariableName(name, VariableName.OUTGOING_ARC_WEIGHT_PREFIX), cardinality)];
            let c = cardinality;
            if (name === step) {
                c += 1;
                foundStep = true;
            }
            result.push(this.variable(this.transitionVariableName(name, VariableName.INGOING_ARC_WEIGHT_PREFIX), -c));
            return result;
        }).reduce((accumulator, value) => accumulator.concat(value), []);

        if (!foundStep) {
            variables.push(this.variable(this.transitionVariableName(step, VariableName.INGOING_ARC_WEIGHT_PREFIX), -1));
        }

        variables.push(this.variable(VariableName.INITIAL_MARKING));

        return this.greaterEqualThan(variables, 0);
    }

    private setUpBaseIlp(): LP {
        const allVariables = Array.from(this._allVariables).concat(VariableName.INITIAL_MARKING);
        return {
            name: 'ilp',
            objective: {
                name: 'goal',
                direction: Goal.MINIMUM,
                vars: allVariables.map(v => {
                    let coef;
                    if (v.startsWith(VariableName.INITIAL_MARKING)) {
                        coef = 30;
                    } else if (v.startsWith(VariableName.OUTGOING_ARC_WEIGHT_PREFIX)) {
                        coef = 10;
                    } else {
                        coef = -1;
                    }
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
        result.subjectTo = result.subjectTo.concat(this.greaterEqualThan(this.variable(this.transitionVariableName(causalPair[0], VariableName.OUTGOING_ARC_WEIGHT_PREFIX)), 1).constraints);
        result.subjectTo = result.subjectTo.concat(this.greaterEqualThan(this.variable(this.transitionVariableName(causalPair[1], VariableName.INGOING_ARC_WEIGHT_PREFIX)), 1).constraints);
        return result;
    }
}
