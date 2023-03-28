import {IlpSolver} from './abstract-ilp-solver';
import {PetriNet} from '../../models/pn/model/petri-net';
import {Observable} from 'rxjs';
import {GLPK, LP} from 'glpk.js';
import {RegionsConfiguration} from './model/regions-configuration';
import {Goal} from '../../models/glpk/glpk-constants';
import {ConstraintsWithNewVariables} from '../../models/glpk/constraints-with-new-variables';
import {Variable} from '../../models/glpk/variable';
import {Arc} from '../../models/pn/model/arc';
import {Transition} from '../../models/pn/model/transition';
import {arraify} from '../arraify';
import {Place} from '../../models/pn/model/place';


interface InitialState {
    pvid: string,
    weight: number
}

interface RiseVariable {
    name: string,
    sign: number
}

export abstract class TokenTrailIlpSolver extends IlpSolver {

    protected _labelRiseVariables: Map<string, Array<RiseVariable>>;
    protected _placeVariables: Set<string>;
    private _riseVariables: Set<string>;
    private _initialStates: Array<InitialState>;
    protected _indexWithInitialStates?: number;

    protected constructor(solver$: Observable<GLPK>) {
        super(solver$);
        this._initialStates = [];
        this._labelRiseVariables = new Map<string, Array<RiseVariable>>();
        this._riseVariables = new Set<string>();
        this._placeVariables = new Set<string>();
    }

    protected setUpInitialILP(nets: Array<PetriNet> | PetriNet, config: RegionsConfiguration = {}): LP {
        this._initialStates = [];
        this._labelRiseVariables.clear();
        this._riseVariables.clear();
        this._placeVariables.clear();
        this._indexWithInitialStates = undefined;

        nets = arraify(nets);
        const placeVars: Array<Variable> = [];
        for (let i = 0; i < nets.length; i++) {
            const net = nets[i];
            for (const p of net.getPlaces()) {
                const pvid = this.getPlaceVariableId(i, p);
                placeVars.push(this.variable(pvid));
                this._placeVariables.add(pvid);
            }
        }

        this._allVariables = new Set<string>(this._placeVariables);

        const initial: LP = {
            name: 'ilp',
            objective: {
                name: 'region',
                direction: Goal.MINIMUM,
                vars: placeVars,
            },
            subjectTo: [],
        };
        const placeVarIds = Array.from(this._placeVariables);
        // TODO restrict rise to {0,1} instead of marking?
        initial[config.oneBoundRegions ? 'binaries' : 'generals'] = placeVarIds;
        this.applyConstraints(initial, this.createInitialConstraints(nets, placeVarIds, config));

        return initial;
    }

    protected createInitialConstraints(nets: Array<PetriNet>, placeVarIds: Array<string>, config: RegionsConfiguration): ConstraintsWithNewVariables {
        const result: Array<ConstraintsWithNewVariables> = [];

        // non-zero solutions
        result.push(this.greaterEqualThan(placeVarIds.map(vid => this.variable(vid)), 1));

        // find a set of places that determines the initial marking (if any)
        let ni: number;
        for (ni = 0; ni < nets.length; ni++) {
            const net = nets[ni];
            const initialPlaces = net.getPlaces().filter(p => p.marking > 0);
            if (initialPlaces.length > 0) {
                this._initialStates = initialPlaces.map(p => ({pvid: this.getPlaceVariableId(ni, p), weight: p.marking}));
                this._indexWithInitialStates = ni;
                break;
            }
        }

        // weighted sum of tokens in places marked as initial must be the same across all nets with at least one token present
        for (ni++; ni < nets.length; ni++) {
            const net = nets[ni];
            const initialPlaces = net.getPlaces().filter(p => p.marking > 0);
            if (initialPlaces.length === 0) {
                continue;
            }

            result.push(this.sumEqualsZero(
                ...this._initialStates.map(is => this.variable(is.pvid, 1)),
                ...initialPlaces.map(p => this.variable(this.getPlaceVariableId(ni, p), -1))
            ));
        }

        // places with no post-set should be empty
        if (config.noOutputPlaces) {
            for (let i = 0; i < nets.length; i++) {
                result.push(...nets[i].getPlaces().filter(p => p.outgoingArcs.length === 0).map(p => this.lessEqualThan(this.variable(this.getPlaceVariableId(i, p)), 0)));
            }
        }

        // rise constraints
        const labels = this.collectTransitionByLabel(nets);
        const riseSumVariables: Array<Variable> = [];
        const absoluteRiseSumVariables: Array<string> = [];

        for (const indexedTransitions of labels.values()) {

            // TODO review this with new rise variables
            const t1 = indexedTransitions[0];
            if (config.obtainPartialOrders) {
                // t1 post-set
                riseSumVariables.push(...this.createVariablesFromPlaceIds(t1.t.outgoingArcs.map((a: Arc) => this.getPlaceVariableId(t1.ni, a.destinationId)), 1));
                // t1 pre-set
                riseSumVariables.push(...this.createVariablesFromPlaceIds(t1.t.ingoingArcs.map((a: Arc) => this.getPlaceVariableId(t1.ni, a.sourceId)), -1));

                const singleRiseVariables = this.createVariablesFromPlaceIds(t1.t.outgoingArcs.map((a: Arc) => this.getPlaceVariableId(t1.ni, a.destinationId)), 1);
                singleRiseVariables.push(...this.createVariablesFromPlaceIds(t1.t.ingoingArcs.map((a: Arc) => this.getPlaceVariableId(t1.ni, a.sourceId)), -1));

                const singleRise = this.combineCoefficients(singleRiseVariables);
                const abs = this.helperVariableName('abs');
                const absoluteRise = this.xAbsoluteOfSum(abs, singleRise);

                absoluteRiseSumVariables.push(abs);
                result.push(ConstraintsWithNewVariables.combineAndIntroduceVariables(
                    undefined, abs,
                    absoluteRise)
                );
            }

            for (const it of indexedTransitions) {
                // weighted sum of tokens in post-set - weighted sum of tokens in pre-set = rise
                // weighted sum of tokens in post-set - weighted sum of tokens in pre-set - rise = 0

                // post-set
                let variables = it.t.outgoingArcs.map(a => this.variable(this.getPlaceVariableId(it.ni, a.destinationId), a.weight));
                // pre-set
                variables.push(...it.t.ingoingArcs.map((a: Arc) => this.variable(this.getPlaceVariableId(it.ni, a.sourceId), -a.weight)));
                variables.push(...this.getRiseVariables(it.t.label!, -1));

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
        // TODO binaries, when oneBound?
        result.push(new ConstraintsWithNewVariables([], undefined, Array.from(this._riseVariables.values())));

        return ConstraintsWithNewVariables.combine(...result);
    }

    private collectTransitionByLabel(nets: Array<PetriNet>): Map<string, Array<{ t: Transition, ni: number }>> {
        const result = new Map<string, Array<{ t: Transition, ni: number }>>();
        for (let ni = 0; ni < nets.length; ni++) {
            const net = nets[ni];
            for (const t of net.getTransitions()) {
                if (t.label === undefined) {
                    throw new Error(`Transition with id '${t.id}' has no label! All transitions must be labeled in the input nets!`);
                }
                const array = result.get(t.label);
                if (array === undefined) {
                    result.set(t.label, [{t, ni}]);
                } else {
                    array.push({t, ni});
                }
            }
        }
        return result;
    }

    private getNetPlaceIdPrefix(netIndex: number): string {
        return `n${netIndex}_`
    }
    protected getPlaceVariableId(netIndex: number, place: Place | string): string {
        return this.getNetPlaceIdPrefix(netIndex) + (typeof place === 'string' ? place : place.id);
    }

    private getTransitionRiseVariables(label: string): Array<RiseVariable> {
        const saved = this._labelRiseVariables.get(label);
        if (saved !== undefined) {
            return saved;
        }

        const prefix = this.helperVariableName('rise');
        const r: Array<RiseVariable> = [
            {name: `${prefix}+`, sign: 1},
            {name: `${prefix}-`, sign: -1}
        ];
        for (const v of r) {
            this._riseVariables.add(v.name);
        }
        this._labelRiseVariables.set(label, r);
        return r;
    }

    protected getRiseVariables(label: string, coef: number = 1): Array<Variable> {
        return this.getTransitionRiseVariables(label).map(rv => this.variable(rv.name, rv.sign * coef));
    }

    protected definesRiseOfLabel(label: string): boolean {
        return this._labelRiseVariables.get(label) !== undefined;
    }
}
