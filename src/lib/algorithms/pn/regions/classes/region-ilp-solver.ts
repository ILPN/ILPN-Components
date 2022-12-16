import {BehaviorSubject, Observable, ReplaySubject, switchMap} from 'rxjs';
import {GLPK, LP} from 'glpk.js';
import {PetriNet} from '../../../../models/pn/model/petri-net';
import {ProblemSolution} from '../../../../models/glpk/problem-solution';
import {Goal, Solution} from '../../../../models/glpk/glpk-constants';
import {Arc} from '../../../../models/pn/model/arc';
import {Transition} from '../../../../models/pn/model/transition';
import {Variable} from '../../../../models/glpk/variable';
import {ConstraintsWithNewVariables} from '../../../../models/glpk/constraints-with-new-variables';
import {PetriNetRegionTransformerService} from '../petri-net-region-transformer.service';
import {CombinationResult} from './combination-result';
import {Region} from './region';
import {RegionsConfiguration} from './regions-configuration';
import {IlpSolver} from '../../../../utility/glpk/abstract-ilp-solver';


export class RegionIlpSolver extends IlpSolver {

    private _placeVariables: Set<string>;


    constructor(private _regionTransformer: PetriNetRegionTransformerService, _solver$: Observable<GLPK>) {
        super(_solver$);
        this._placeVariables = new Set<string>();
    }

    public computeRegions(nets: Array<PetriNet>, config: RegionsConfiguration): Observable<Region> {

        const regions$ = new ReplaySubject<Region>();

        const combined = this.combineInputNets(nets);

        const ilp$ = new BehaviorSubject(this.setUpInitialILP(combined, config));
        ilp$.pipe(switchMap(ilp => this.solveILP(ilp))).subscribe((ps: ProblemSolution) => {
            if (ps.solution.result.status === Solution.OPTIMAL) {
                const region = this._regionTransformer.displayRegionInNet(ps.solution, combined.net);

                // TODO check if the region is new and we are not trapped in a loop

                const nonEmptyInputSet = combined.inputs.find(inputs => inputs.size > 0) ?? [];

                regions$.next({net: region, inputs: Array.from(nonEmptyInputSet)});
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

    private combineInputNets(nets: Array<PetriNet>): CombinationResult {
        if (nets.length === 0) {
            throw new Error('Synthesis must be performed on at least one input net!');
        }

        let result = nets[0];
        const inputs: Array<Set<string>> = [result.inputPlaces];
        const outputs: Array<Set<string>> = [result.outputPlaces];

        for (let i = 1; i < nets.length; i++) {
            const union = PetriNet.netUnion(result, nets[i]);
            result = union.net;
            inputs.push(union.inputPlacesB);
            outputs.push(union.outputPlacesB);
        }

        return {net: result, inputs, outputs};
    }

    private setUpInitialILP(combined: CombinationResult, config: RegionsConfiguration): LP {
        const net = combined.net;

        this._placeVariables = new Set(net.getPlaces().map(p => p.getId()));
        this._allVariables = new Set<string>(this._placeVariables);

        const initial: LP = {
            name: 'ilp',
            objective: {
                name: 'region',
                direction: Goal.MINIMUM,
                vars: net.getPlaces().map(p => this.variable(p.getId())),
            },
            subjectTo: [],
        };
        initial[config.oneBoundRegions ? 'binaries' : 'generals'] = Array.from(this._placeVariables);
        this.applyConstraints(initial, this.createInitialConstraints(combined, config));

        return initial;
    }

    private createInitialConstraints(combined: CombinationResult, config: RegionsConfiguration): ConstraintsWithNewVariables {
        const net = combined.net;
        const result: Array<ConstraintsWithNewVariables> = [];

        // only non-negative solutions
        result.push(...net.getPlaces().map(p => this.greaterEqualThan(this.variable(p.getId()), 0)));

        // non-zero solutions
        result.push(this.greaterEqualThan(net.getPlaces().map(p => this.variable(p.getId())), 1));

        // initial markings must be the same
        if (combined.inputs.length > 1) {
            const nonemptyInputs = combined.inputs.filter(inputs => inputs.size !== 0);
            const inputsA = Array.from(nonemptyInputs[0]);
            for (let i = 1; i < nonemptyInputs.length; i++) {
                const inputsB = Array.from(nonemptyInputs[i]);
                result.push(this.sumEqualsZero(...inputsA.map(id => this.variable(id, 1)), ...inputsB.map(id => this.variable(id, -1))));
            }
        }

        // places with no post-set should be empty
        if (config.noOutputPlaces) {
            result.push(...net.getPlaces().filter(p => p.outgoingArcs.length === 0).map(p => this.lessEqualThan(this.variable(p.getId()), 0)));
        }

        // gradient constraints
        const labels = this.collectTransitionByLabel(net);
        const riseSumVariables: Array<Variable> = [];
        const absoluteRiseSumVariables: Array<string> = [];

        for (const [key, transitions] of labels.entries()) {
            const transitionsWithSameLabel = transitions.length;
            const t1 = transitions.splice(0, 1)[0];

            if (config.obtainPartialOrders) {
                // t1 post-set
                riseSumVariables.push(...this.createVariablesFromPlaceIds(t1.outgoingArcs.map((a: Arc) => a.destinationId), 1));
                // t1 pre-set
                riseSumVariables.push(...this.createVariablesFromPlaceIds(t1.ingoingArcs.map((a: Arc) => a.sourceId), -1));

                const singleRiseVariables = this.createVariablesFromPlaceIds(t1.outgoingArcs.map((a: Arc) => a.destinationId), 1);
                singleRiseVariables.push(...this.createVariablesFromPlaceIds(t1.ingoingArcs.map((a: Arc) => a.sourceId), -1));

                const singleRise = this.combineCoefficients(singleRiseVariables);
                const abs = this.helperVariableName('abs');
                const absoluteRise = this.xAbsoluteOfSum(abs, singleRise);

                absoluteRiseSumVariables.push(abs);
                result.push(ConstraintsWithNewVariables.combineAndIntroduceVariables(
                    undefined, abs,
                    absoluteRise)
                );
            }

            if (transitionsWithSameLabel === 1) {
                continue;
            }

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

        if (config.obtainPartialOrders) {
            /*
                Sum of rises should be 0 AND Sum of absolute rises should be 2 (internal places)
                OR
                Sum of absolute rises should be 1 (initial and final places)
             */

            // sum of rises is 0
            const riseSumIsZero = this.helperVariableName('riseEqualZero');
            result.push(this.xWhenAEqualsB(riseSumIsZero, this.combineCoefficients(riseSumVariables), 0));
            // sum of absolute values of rises is 2
            const absRiseSumIsTwo = this.helperVariableName('absRiseSumTwo');
            result.push(this.xWhenAEqualsB(absRiseSumIsTwo, absoluteRiseSumVariables, 2));
            // sum is 0 AND sum absolute is 2
            const internalPlace = this.helperVariableName('placeIsInternal');
            result.push(ConstraintsWithNewVariables.combineAndIntroduceVariables(
                [riseSumIsZero, absRiseSumIsTwo], undefined,
                this.xAandB(internalPlace, riseSumIsZero, absRiseSumIsTwo)
            ));

            // sum of absolute values of rise is 1
            const absRiseSumIsOne = this.helperVariableName('absRiseSumOne');
            result.push(this.xWhenAEqualsB(absRiseSumIsOne, absoluteRiseSumVariables, 1));

            // place is internal OR place is initial/final
            const internalOrFinal = this.helperVariableName('internalOrFinal');
            result.push(ConstraintsWithNewVariables.combineAndIntroduceVariables(
                [internalPlace, absRiseSumIsOne, internalOrFinal], undefined,
                this.xAorB(internalOrFinal, internalPlace, absRiseSumIsOne)
            ));

            // place is internal OR place is initial/final must be true
            result.push(this.equal(this.variable(internalOrFinal), 1));
        }

        return ConstraintsWithNewVariables.combine(...result);
    }

    private addConstraintsToILP(ps: ProblemSolution): LP {
        const ilp = ps.ilp;

        // no region that contains the new solution as subset
        const region = ps.solution.result.vars;
        const regionPlaces = Object.entries(region).filter(([k, v]) => v != 0 && this._placeVariables.has(k));
        const additionalConstraints = regionPlaces.map(([k, v]) => this.yWhenAGreaterEqualB(k, v));

        const yVariables =
            additionalConstraints
                .reduce(
                    (arr, constraint) => {
                        arr.push(...constraint.binaryVariables);
                        return arr;
                    }, [] as Array<string>)
                .map(
                    y => this.variable(y)
                );
        /*
            Sum of x-es should be less than their number
            x = 1 - y
            Therefore sum of y should be greater than 0
         */
        additionalConstraints.push(this.sumGreaterThan(yVariables, 0));
        this.applyConstraints(ilp, ConstraintsWithNewVariables.combine(...additionalConstraints));

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
}
