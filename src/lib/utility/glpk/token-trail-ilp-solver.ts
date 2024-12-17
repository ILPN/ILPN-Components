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
import {MapArray} from '../map-array';


interface InitialState {
    pvid: string,
    weight: number
}

export abstract class TokenTrailIlpSolver extends IlpSolver {

    protected _labelRiseVariables: MapArray<string, Array<Variable>>;
    protected _placeVariables: Set<string>;
    private _initialStates: Array<InitialState>;
    protected _indexWithInitialStates?: number;

    protected constructor(solver$: Observable<GLPK>) {
        super(solver$);
        this._initialStates = [];
        this._labelRiseVariables = new MapArray<string, Array<Variable>>();
        this._placeVariables = new Set<string>();
    }

    protected setUpInitialILP(nets: Array<PetriNet> | PetriNet, config: RegionsConfiguration = {}): LP {
        this._initialStates = [];
        this._labelRiseVariables.clear();
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

        const placeVarIds = Array.from(this._placeVariables);
        const initial: LP = {
            name: 'ilp',
            objective: {
                name: 'region',
                direction: Goal.MINIMUM,
                vars: placeVars,
            },
            generals: placeVarIds,
            subjectTo: [],
        };
        this.applyConstraints(initial, this.createInitialConstraints(nets, placeVarIds, config));

        return initial;
    }

    protected createInitialConstraints(nets: Array<PetriNet>, placeVarIds: Array<string>, config: RegionsConfiguration): ConstraintsWithNewVariables {
        const result: Array<ConstraintsWithNewVariables> = [];

        // markings have an upper-bound k, so that we can express logical conditions with ILP
        // also prevents an infinite loop in the glpk preprocessor; see https://lists.gnu.org/archive/html/help-glpk/2010-12/msg00055.html
        for (const vid of placeVarIds) {
            result.push(this.lessEqualThan(this.variable(vid), IlpSolver.k));
        }

        // find a set of places that determines the initial marking (if any)
        let ni: number;
        for (ni = 0; ni < nets.length; ni++) {
            const net = nets[ni];
            const initialPlaces = net.getPlaces().filter(p => p.marking > 0);
            if (initialPlaces.length > 0) {
                this._initialStates = initialPlaces.map(p => ({
                    pvid: this.getPlaceVariableId(ni, p),
                    weight: p.marking
                }));
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

            // collect the rise specifications
            for (const it of indexedTransitions) {
                // weighted sum of tokens in post-set - weighted sum of tokens in pre-set = rise

                // post-set
                const variables = it.t.outgoingArcs.map(a => this.variable(this.getPlaceVariableId(it.ni, a.destinationId), a.weight));
                // pre-set
                variables.push(...it.t.ingoingArcs.map((a: Arc) => this.variable(this.getPlaceVariableId(it.ni, a.sourceId), -a.weight)));

                // TODO handle transitions with empty pre-/post-set correctly
                this._labelRiseVariables.push(it.t.label!, this.combineCoefficients(variables));
            }
        }

        // express the rise constraints
        for (const [label, sums] of this._labelRiseVariables.entries()) {
            console.debug(`rise constraints for '${label}'`);

            const sum1 = sums[0];

            for (let i = 0; i < sums.length; i++) {
                const sum = sums[i];

                if (config.noArcWeights) {
                    // rises and therefore arc weights are constrained to [-1; 1];
                    result.push(
                        this.lessEqualThan(sum, 1),
                        this.greaterEqualThan(sum, -1)
                    )
                }

                if (i === 0) {
                    continue;
                }

                // all rises of the same label must be the same
                // rise1 = rise2
                // rise1 - rise2 = 0
                result.push(
                    this.sumEqualsZero(...this.combineCoefficients([
                        ...sum1,
                        ...this.constantMultiplication(sum, -1)
                    ]))
                );
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

    protected definesRiseOfLabel(label: string): boolean {
        return this._labelRiseVariables.get(label).length !== 0;
    }
}
