import {Injectable} from "@angular/core";
import {PlainPetriNetParserService} from "./plain-petri-net-parser.service";
import {Parser} from "../../../../utility/parsing/parser";
import {PetriNet} from "../../model/petri-net";
import {JsonPetriNetParserService} from "./json-petri-net-parser.service";
import {PnmlPetriNetParserService} from "./pnml-petri-net-parser.service";

@Injectable({
    providedIn: 'root'
})
export class PetriNetParserService implements Parser<PetriNet>{
    constructor(protected _plainParser: PlainPetriNetParserService,
                protected _jsonParser: JsonPetriNetParserService,
                protected _pnmlParser: PnmlPetriNetParserService) {
    }

    parse(text: string): PetriNet | undefined {
        const trimmed = text.trimStart();
        switch (trimmed.charAt(0)) {
            case '.':
                return this._plainParser.parse(text);
            case '{':
                return this._jsonParser.parse(text);
            case '<':
                return this._pnmlParser.parse(text);
            default:
                console.error('provided text does not match any supported Petri net format. Petri net cannot be parsed.', text);
                return undefined;
        }
    }

}
