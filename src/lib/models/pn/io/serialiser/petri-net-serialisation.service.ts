import {Injectable} from '@angular/core';
import {PetriNet} from '../../model/petri-net';
import {PnOutputFileFormat} from "../model/pn-output-file-format";
import {PlainPetriNetSerialisationService} from "./plain-petri-net-serialisation.service";
import {JsonPetriNetSerialisationService} from "./json-petri-net-serialisation.service";


@Injectable({
    providedIn: 'root'
})
export class PetriNetSerialisationService {

    constructor(protected _plainSerialisationService: PlainPetriNetSerialisationService,
                protected _jsonSerialisationService: JsonPetriNetSerialisationService) {
    }

    public serialise(net: PetriNet, format: PnOutputFileFormat = PnOutputFileFormat.PLAIN): string {
        switch (format) {
            case PnOutputFileFormat.PLAIN:
                return this._plainSerialisationService.serialise(net);
            case PnOutputFileFormat.JSON:
                return this._jsonSerialisationService.serialise(net);
            default:
                throw new Error(`Unsupported output file format '${format}'`);
        }
    }
}
