import {SubjectTo} from '../../../../models/glpk/subject-to';


export class NewVariableWithConstraint {

    private readonly _id: string;
    private readonly _constraints: Array<SubjectTo>;

    constructor(id: string, constraints: Array<SubjectTo>) {
        this._id = id;
        this._constraints = constraints;
    }

    get id(): string {
        return this._id;
    }

    get constraints(): Array<SubjectTo> {
        return this._constraints;
    }
}
