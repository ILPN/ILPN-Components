import {Injectable} from "@angular/core";
import {PetriNet} from "../../model/petri-net";
import {JsonPetriNetConverterService} from "../json-petri-net-converter.service";


@Injectable({
    providedIn: 'root'
})
export class JsonPetriNetSerialisationService {

    constructor(protected _jsonNetConverter: JsonPetriNetConverterService) {
    }

    public serialise(net: PetriNet): string {
        return JSON.stringify(this._jsonNetConverter.toJson(net));
    }
}
