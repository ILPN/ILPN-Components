import {IlpSolver} from './abstract-ilp-solver';
import {Observable} from 'rxjs';
import {GLPK} from 'glpk.js';
import {VariableName} from './model/variable-name';
import {SolutionVariable} from './model/solution-variable';
import {VariableType} from './model/variable-type';


export abstract class ArcWeightIlpSolver extends IlpSolver {

    private readonly _labelVariableMapIngoing: Map<string, string>;
    private readonly _labelVariableMapOutgoing: Map<string, string>;
    private readonly _inverseLabelVariableMapIngoing: Map<string, string>;
    private readonly _inverseLabelVariableMapOutgoing: Map<string, string>;

    protected constructor(solver$: Observable<GLPK>) {
        super(solver$);
        this._labelVariableMapIngoing = new Map<string, string>();
        this._labelVariableMapOutgoing = new Map<string, string>();
        this._inverseLabelVariableMapIngoing = new Map<string, string>();
        this._inverseLabelVariableMapOutgoing = new Map<string, string>();
    }

    protected transitionVariableName(label: string, prefix: 'x' | 'y'): string {
        let map, inverseMap;
        if (prefix === VariableName.INGOING_ARC_WEIGHT_PREFIX) {
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

    public getInverseVariableMapping(variable: string): SolutionVariable {
        if (variable === VariableName.INITIAL_MARKING) {
            return {
                label: VariableName.INITIAL_MARKING,
                type: VariableType.INITIAL_MARKING
            }
        } else if (variable.startsWith(VariableName.INGOING_ARC_WEIGHT_PREFIX)) {
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
