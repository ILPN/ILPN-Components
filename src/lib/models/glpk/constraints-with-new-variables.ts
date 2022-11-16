import {SubjectTo} from './subject-to';


export class ConstraintsWithNewVariables {

    private readonly _binaryVariables: Array<string>;
    private readonly _integerVariables: Array<string>;
    private readonly _constraints: Array<SubjectTo>;

    constructor(constraints: SubjectTo | Array<SubjectTo>,
                binaryVariables?: string | Array<string>,
                integerVariables?: string | Array<string>) {
        this._constraints = Array.isArray(constraints) ? constraints : [constraints];
        if (binaryVariables !== undefined) {
            this._binaryVariables = Array.isArray(binaryVariables) ? binaryVariables : [binaryVariables];
        } else {
            this._binaryVariables = [];
        }
        if (integerVariables !== undefined) {
            this._integerVariables = Array.isArray(integerVariables) ? integerVariables : [integerVariables];
        } else {
            this._integerVariables = [];
        }
    }

    get binaryVariables(): Array<string> {
        return this._binaryVariables;
    }

    get integerVariables(): Array<string> {
        return this._integerVariables;
    }

    get constraints(): Array<SubjectTo> {
        return this._constraints;
    }

    public static combine(...constraints: Array<ConstraintsWithNewVariables>): ConstraintsWithNewVariables {
        return new ConstraintsWithNewVariables(
            constraints.reduce((a, v) => {
                a.push(...v.constraints)
                return a;
            }, [] as Array<SubjectTo>),
            constraints.reduce((a, v) => {
                a.push(...v.binaryVariables)
                return a;
            }, [] as Array<string>),
            constraints.reduce((a, v) => {
                a.push(...v.integerVariables)
                return a;
            }, [] as Array<string>)
        );
    }

    public static combineAndIntroduceVariables(newBinaryVariables?: string | Array<string>,
                                               newIntegerVariables?: string | Array<string>,
                                               ...constraints: Array<ConstraintsWithNewVariables>): ConstraintsWithNewVariables {
        return ConstraintsWithNewVariables.combine(
            new ConstraintsWithNewVariables([], newBinaryVariables, newIntegerVariables),
            ...constraints
        )
    }
}
