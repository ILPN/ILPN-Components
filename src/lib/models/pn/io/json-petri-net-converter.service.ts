import {Injectable} from "@angular/core";
import {PetriNet} from "../model/petri-net";
import {JsonPetriNet} from "./model/json-petri-net";



@Injectable({
    providedIn: 'root'
})
export class JsonPetriNetConverterService {

    public toJson(net: PetriNet): JsonPetriNet {
        // TODO support converting an SvgPetriNet as well to export layout information

        const result: JsonPetriNet = {
            places: [],
            transitions: [],
            arcs: {},
            labels: {},
            marking: {}
        };
        const actions = new Set<string>();

        for (const p of net.getPlaces()) {
            const pid = p.getId();
            result.places.push(pid);
            result.marking![pid] = p.marking;
        }

        for (const t of net.getTransitions()) {
            const tid = t.getId();
            result.transitions.push(tid);
            if (t.label) {
                actions.add(t.label);
                result.labels![tid] = t.label;
            }
        }

        for (const a of net.getArcs()) {
            result.arcs![`${a.sourceId},${a.destinationId}`] = a.weight;
        }

        result.actions = Array.from(actions);

        return result;
    }

    // TODO implement and refactor parser to use this method
    // public fromJson(raw: JsonPetriNet): PetriNet {
    //
    // }
}
