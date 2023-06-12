import {Marking} from "../../../../models/pn/model/marking";
import {Transition} from "../../../../models/pn/model/transition";

export class MarkingWithEnabledTransitions {

    public readonly enabledTransitions: Array<string>;
    public evaluatedEnabledTransitions: boolean = false;

    constructor(public marking: Marking) {
        this.enabledTransitions = [];
    }

    public addEnabledTransitions(transitions: Array<Transition>) {
        for (const t of transitions) {
            this.enabledTransitions.push(t.getId());
        }
        this.evaluatedEnabledTransitions = true;
    }
}
