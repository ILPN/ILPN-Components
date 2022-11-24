import {ArcWeightIlpSolver} from '../../../../utility/glpk/ArcWeightIlpSolver';
import {concatMap, from, Observable, toArray} from 'rxjs';
import {GLPK, LP} from 'glpk.js';
import {PartialOrder} from '../../../../models/po/model/partial-order';
import {ProblemSolution} from '../../../../models/glpk/problem-solution';
import {SubjectTo} from '../../../../models/glpk/subject-to';
import {Event} from '../../../../models/po/model/event';
import {VariableName} from '../../../../utility/glpk/model/variable-name';
import {DirectlyFollowsExtractor} from '../../../../utility/directly-follows-extractor';
import {Goal} from '../../../../models/glpk/glpk-constants';


export class IlpplMinerIlpSolver extends ArcWeightIlpSolver {

    private static readonly PO_ARC_SEPARATOR = '#';
    private static readonly FINAL_MARKING = 'mf';

    private readonly _directlyFollowsExtractor: DirectlyFollowsExtractor;
    private readonly _poVariableNames: Set<string>;

    constructor(solver$: Observable<GLPK>) {
        super(solver$);
        this._directlyFollowsExtractor = new DirectlyFollowsExtractor();
        this._poVariableNames = new Set<string>();
    }

    public findSolutions(pos: Array<PartialOrder>): Observable<Array<ProblemSolution>> {
        const baseIlpConstraints: Array<SubjectTo> = [];

        for (let i = 0; i < pos.length; i++) {
            const events = pos[i].events;
            for (const e of events) {
                baseIlpConstraints.push(...this.firingRule(e, i));
                baseIlpConstraints.push(...this.tokenFlow(e, i));
            }
            baseIlpConstraints.push(...this.initialMarking(events, i));
        }

        const baseIlp = this.setUpBaseIlp();

        const problems = this._directlyFollowsExtractor.oneWayDirectlyFollows().map(pair => ({
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

    private firingRule(event: Event, i: number): Array<SubjectTo> {
        const variables = [this.variable(this.getPoEventId(event.id, i))];
        for (const pre of event.previousEvents) {
            variables.push(this.variable(this.getPoArcId(pre.id, event.id, i)));
            this._directlyFollowsExtractor.add(event.label!, pre.label!);
        }
        variables.push(this.variable(this.transitionVariableName(event.label!, VariableName.INGOING_ARC_WEIGHT_PREFIX), -1));
        return this.greaterEqualThan(variables, 0).constraints;
    }

    private tokenFlow(event: Event, i: number): Array<SubjectTo> {
        const variables = [this.variable(this.getPoEventId(event.id, i))];
        for (const pre of event.previousEvents) {
            variables.push(this.variable(this.getPoArcId(pre.id, event.id, i)));
        }
        for (const post of event.nextEvents) {
            variables.push(this.variable(this.getPoArcId(event.id, post.id, i), -1));
        }
        if (event.nextEvents.size === 0) {
            variables.push(this.variable(this.getPoArcId(event.id, IlpplMinerIlpSolver.FINAL_MARKING, i), -1));
        }
        variables.push(this.variable(this.transitionVariableName(event.label!, VariableName.INGOING_ARC_WEIGHT_PREFIX), -1));
        variables.push(this.variable(this.transitionVariableName(event.label!, VariableName.OUTGOING_ARC_WEIGHT_PREFIX)));
        return this.equal(variables, 0).constraints;
    }

    private initialMarking(events: Array<Event>, i: number): Array<SubjectTo> {
        const variables = events.map(e => this.variable(this.getPoEventId(e.id, i), -1));
        variables.push(this.variable(VariableName.INITIAL_MARKING));
        return this.equal(variables, 0).constraints;
    }

    private getPoEventId(id: string, i: number): string {
        const d = `${i}${IlpplMinerIlpSolver.PO_ARC_SEPARATOR}${id}`;
        this._poVariableNames.add(d);
        return d;
    }

    private getPoArcId(sourceId: string, destinationId: string, i: number): string {
        const id = `${i}${IlpplMinerIlpSolver.PO_ARC_SEPARATOR}${sourceId}${IlpplMinerIlpSolver.PO_ARC_SEPARATOR}${destinationId}`;
        this._poVariableNames.add(id);
        return id;
    }

    private setUpBaseIlp(): LP {
        const goalVariables = Array.from(this._allVariables).concat(VariableName.INITIAL_MARKING);
        return {
            name: 'ilp',
            objective: {
                name: 'goal',
                direction: Goal.MINIMUM,
                vars: goalVariables.map(v => {
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
                // vars: Array.from(this._poVariableNames).map(v => {
                //     return this.variable(v, 1);
                // })
            },
            subjectTo: [],
            // TODO enable arc weights with a config setting?
            binaries: goalVariables,
            generals: Array.from(this._poVariableNames)
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
