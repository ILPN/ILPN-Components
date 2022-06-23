import {SubjectTo} from '../../../../models/glpk/subject-to';


export class NewVariableWithConstraint {

    private readonly _ids: Array<string>;
    private readonly _constraints: Array<SubjectTo>;

    constructor(ids: string | Array<string>, constraints: Array<SubjectTo>) {
        this._ids = Array.isArray(ids) ? ids : [ids];
        this._constraints = constraints;
    }

    get ids(): Array<string> {
        return this._ids;
    }

    get constraints(): Array<SubjectTo> {
        return this._constraints;
    }

    public static combine(...newVariablesWithConstraints: Array<NewVariableWithConstraint>): NewVariableWithConstraint {
        return new NewVariableWithConstraint(
            newVariablesWithConstraints.reduce((a, v) => {
                a.push(...v.ids)
                return a;
            }, [] as Array<string>),
            newVariablesWithConstraints.reduce((a, v) => {
                a.push(...v.constraints)
                return a;
            }, [] as Array<SubjectTo>)
        );
    }
}
