import {Injectable} from '@angular/core';
import {IlpSolverService} from '../../../../utility/glpk/ilp-solver.service';
import {PetriNet} from '../../../../models/pn/model/petri-net';
import {Observable} from 'rxjs';
import {TokenTrailValidationResult} from '../classes/validation-result';
import {TokenTrailValidator} from './token-trail-validator';


@Injectable({
    providedIn: 'root'
})
export class TokenTrailValidatorService extends IlpSolverService {

    constructor() {
        super();
    }

    public validate(model: PetriNet, spec: PetriNet): Observable<Array<TokenTrailValidationResult>> {
        const validator = new TokenTrailValidator(model, spec, this._solver$);
        return validator.validate();
    }
}
