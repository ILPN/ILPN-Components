import {Injectable} from "@angular/core";
import {Parser} from "../../../../utility/parsing/parser";
import {PetriNet} from "../../model/petri-net";
import {JsonPetriNet} from "../model/json-petri-net";
import {Transition} from "../../model/transition";
import {Place} from "../../model/place";
import {Arc} from "../../model/arc";

@Injectable({
    providedIn: 'root'
})
export class JsonPetriNetParserService implements Parser<PetriNet> {

    parse(text: string): PetriNet | undefined {
        // Implementation based on: https://github.com/ILPN/Abschlussarbeit-model-repair-with-partial-orders
        // TODO JSON schema validation

        let contentObject: JsonPetriNet;
        try {
            contentObject = JSON.parse(text);
        } catch (e) {
            console.error(`The provided Petri net file is not a JSON. [${(e as SyntaxError).name}]: ${(e as SyntaxError).message}`);
            return undefined;
        }

        const petriNet = new PetriNet();

        if (contentObject.transitions === undefined || !Array.isArray(contentObject.transitions)) {
            console.error(`The Petri net JSON file must contain a 'transitions' string array attribute`);
            return undefined;
        }
        for (const t of contentObject.transitions) {
            if (petriNet.getTransition(t)) {
                console.warn(`File contains duplicate transitions. Duplicate transitions are ignored`);
            } else {
                // assume no label
                const trans = new Transition(undefined, t);
                petriNet.addTransition(trans);
            }
        }

        if (contentObject.places === undefined || !Array.isArray(contentObject.places)) {
            console.error(`The Petri net JSON file must contain a 'places' string array attribute`);
            return undefined;
        }
        for (const p of contentObject.places) {
            if (petriNet.getPlace(p)) {
                console.warn(`File contains duplicate places. Duplicate places are ignored`);
            } else {
                const place = new Place(0, p);
                petriNet.addPlace(place);
            }
        }

        if (contentObject.arcs !== undefined && typeof contentObject.arcs === 'object') {
            for (const a of Object.entries(contentObject.arcs)) {
                const ids = a[0].split(',');
                if (ids.length !== 2) {
                    console.warn(`Arc id '${a[0]}' is malformed. Arc id must be of the form '<id>,<id>'. Malformed arc ignored.`);
                    continue;
                }

                const source = petriNet.getNodeWithId(ids[0]);
                const target = petriNet.getNodeWithId(ids[1]);
                if (!source || !target) {
                    console.warn(`An arc between ${ids[0]} and ${ids[1]} is invalid. Invalid arcs are ignored.`);
                    continue;
                }
                if (source.constructor === target.constructor) {
                    console.warn(`Arc between ${ids[0]} and ${ids[1]} connect elements of the same type and will be ignored. Malformed arcs are ignored.`);
                    continue;
                }
                petriNet.addArc(new Arc(a[0], source, target, a[1]));
            }
        }

        if (contentObject.marking !== undefined && typeof contentObject.marking === 'object') {
            for (const p of Object.entries(contentObject.marking)) {
                const place = petriNet.getPlace(p[0]);
                if (place === undefined) {
                    console.warn(`The net does not contain a place with the id '${p[0]}'. Marking of this place will be ignored.`);
                    continue;
                }
                if (p[1] < 0) {
                    console.warn(`The marking of the place '${p[0]}' is negative. Malformed marking ignored.`,);
                    continue;
                }
                place.marking = p[1];
            }
        }

        if (contentObject.labels !== undefined && typeof contentObject.labels === 'object') {
            for (const l of Object.entries(contentObject.labels)) {
                const trans = petriNet.getTransition(l[0]);
                if (trans === undefined) {
                    console.warn(`The net does not contain a transition with the id '${l[0]}'. Label for this transition will be ignored.`);
                    continue;
                }
                trans.label = l[1];
            }
        } else {
            // no labels => use identity labeling function
            petriNet.getTransitions().forEach(t => t.label = t.getId());
        }

        return petriNet;
    }
}
