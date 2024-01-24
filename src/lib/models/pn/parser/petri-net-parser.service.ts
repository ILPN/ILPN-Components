import {Injectable} from "@angular/core";
import {PlainPetriNetParserService} from "./plain-petri-net-parser.service";
import {Parser} from "../../../utility/parsing/parser";
import {PetriNet} from "../model/petri-net";

@Injectable({
    providedIn: 'root'
})
export class PetriNetParserService implements Parser<PetriNet>{
    constructor(protected _plainParser: PlainPetriNetParserService) {
    }

    parse(text: string): PetriNet | undefined {
        const trimmed = text.trimStart();
        switch (trimmed.charAt(0)) {
            case '.':
                return this._plainParser.parse(text);
            default:
                console.error('provided text does not match any supported Petri net format. Petri net cannot be parsed.', text);
                return undefined;
        }
    }

}
