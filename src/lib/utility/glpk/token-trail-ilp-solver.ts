import {IlpSolver} from './abstract-ilp-solver';
import {PetriNet} from '../../models/pn/model/petri-net';
import {CombinationResult} from './model/combination-result';
import {Observable} from 'rxjs';
import {GLPK, LP} from 'glpk.js';
import {RegionsConfiguration} from './model/regions-configuration';
import {Goal} from '../../models/glpk/glpk-constants';
import {ConstraintsWithNewVariables} from '../../models/glpk/constraints-with-new-variables';
import {Variable} from '../../models/glpk/variable';
import {Arc} from '../../models/pn/model/arc';
import {Transition} from '../../models/pn/model/transition';


export abstract class TokenTrailIlpSolver extends IlpSolver {

    protected _placeVariables: Set<string>;
    protected _labelRiseVariable: Map<string, string>;
    protected _riseVariableLabel: Map<string, string>;

    protected constructor(solver$: Observable<GLPK>) {
        super(solver$);
        this._placeVariables = new Set<string>();
        this._labelRiseVariable = new Map<string, string>();
        this._riseVariableLabel = new Map<string, string>();
    }

    protected combineInputNets(nets: Array<PetriNet>): CombinationResult {
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

    protected setUpInitialILP(combined: CombinationResult, config: RegionsConfiguration = {}): LP {
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

    protected createInitialConstraints(combined: CombinationResult, config: RegionsConfiguration): ConstraintsWithNewVariables {
        const net = combined.net;
        const result: Array<ConstraintsWithNewVariables> = [];

        // only non-negative solutions (only if non-binary solutions)
        if (!config.oneBoundRegions) {
            result.push(...net.getPlaces().map(p => this.greaterEqualThan(this.variable(p.getId()), 0)));
        }

        // non-zero solutions
        result.push(this.greaterEqualThan(net.getPlaces().map(p => this.variable(p.getId())), 1));

        // initial markings must be the same (if multiple specification nets)
        // TODO check if this formulation has not changed
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

        // rise constraints
        const labels = this.collectTransitionByLabel(net);
        const riseSumVariables: Array<Variable> = [];
        const absoluteRiseSumVariables: Array<string> = [];

        for (const [key, transitions] of labels.entries()) {
            const t1 = transitions[0];

            // TODO review this with new rise variables
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

            const rise = this.getTransitionRiseVariable(t1);

            for (const t of transitions) {
                // sum of tokens in post-set - sum of tokens in pre-set = rise
                // sum of tokens in post-set - sum of tokens in pre-set - rise = 0

                // post-set
                let variables = this.createVariablesFromPlaceIds(t.outgoingArcs.map((a: Arc) => a.destinationId), 1);
                // pre-set
                variables.push(...this.createVariablesFromPlaceIds(t.ingoingArcs.map((a: Arc) => a.sourceId), -1));
                variables.push(this.variable(rise, -1));

                variables = this.combineCoefficients(variables);

                result.push(this.sumEqualsZero(...variables));
            }
        }

        // TODO review this with new rise variables
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

        // add rise variables to generals
        result.push(new ConstraintsWithNewVariables([], undefined, Array.from(this._riseVariableLabel.keys())));

        return ConstraintsWithNewVariables.combine(...result);
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

    private getTransitionRiseVariable(transition: Transition): string {
        const saved = this._labelRiseVariable.get(transition.label!);
        if (saved !== undefined) {
            return saved;
        }

        const r = this.helperVariableName('rise');
        this._labelRiseVariable.set(transition.label!, r);
        this._riseVariableLabel.set(r, transition.label!);
        return r;
    }

    protected getRiseOfLabel(label: string): string | undefined {
        return this._labelRiseVariable.get(label);
    }

    protected getLabelOfRise(rise: string): string | undefined {
        return this._riseVariableLabel.get(rise);
    }
}
