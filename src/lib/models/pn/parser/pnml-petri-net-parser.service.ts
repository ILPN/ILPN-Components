import {Injectable} from "@angular/core";
import {Parser} from "../../../utility/parsing/parser";
import {PetriNet} from "../model/petri-net";
import {PnmlPage, PnmlWrapper} from "./model/pnml.type";
import {XMLParser} from "fast-xml-parser";
import {Transition} from "../model/transition";
import {Place} from "../model/place";

@Injectable({
    providedIn: 'root'
})
export class PnmlPetriNetParserService implements Parser<PetriNet> {

    parse(text: string): PetriNet | undefined {
        // implementation based on https://github.com/ILPN/Abschlussarbeit-model-repair-with-partial-orders

        const parser = new XMLParser({
            attributeNamePrefix: '',
            ignoreAttributes: false,
            allowBooleanAttributes: true,
        });

        const pnml: PnmlWrapper = parser.parse(text);
        const page: PnmlPage = pnml.pnml.net.page ?? pnml.pnml.net;

        const petriNet = new PetriNet();

        page.transition.forEach((transition) => {
            let label = transition.name?.text;
            if (label) {
                label = label.replace(/\s/g, '_');
            }
            petriNet.addTransition(new Transition(label, transition.id));
        });

        page.place.forEach((place) => {
            petriNet.addPlace(new Place(place.initialMarking?.text ?? 0, place.id));
        });

        page.arc.forEach((arc) => {
            const source = petriNet.getNodeWithId(arc.source);
            const target = petriNet.getNodeWithId(arc.target);
            if (!source || !target) {
                console.warn(`An arc between ${arc.source} and ${arc.target} is invalid. Invalid arcs are ignored.`);
                return;
            }
            if (source.constructor === target.constructor) {
                console.warn(`Arc between ${arc.source} and ${arc.target} connect elements of the same type and will be ignored. Malformed arcs are ignored.`);
                return;
            }
            petriNet.addArc(source as Place, target as Transition, arc?.inscription?.text ?? 1);
        });

        return petriNet;
    }

}
