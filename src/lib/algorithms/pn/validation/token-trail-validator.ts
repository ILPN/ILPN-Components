import {TokenTrailValidationResult} from './classes/validation-result';
import {PetriNet} from '../../../models/pn/model/petri-net';


export class TokenTrailValidator {

    private _model: PetriNet;
    private _specs: Array<PetriNet>;

    constructor(model: PetriNet, specs: Array<PetriNet>) {
        this._model = model;
        this._specs = specs;
    }

    public validate(): Array<TokenTrailValidationResult> {
        return [];
    }
}
