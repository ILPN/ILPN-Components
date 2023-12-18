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

    public equals(other: MarkingWithEnabledTransitions) {
        if (!this.marking.equals(other.marking)) {
            return false;
        }
        if (this.evaluatedEnabledTransitions !== other.evaluatedEnabledTransitions) {
            return false;
        }
        if (!this.evaluatedEnabledTransitions) {
            return true;
        }
        if (this.enabledTransitions.length !== other.enabledTransitions.length) {
            return false;
        }
        // inefficient?
        return this.enabledTransitions.every(t => {
            return other.enabledTransitions.find(ot => ot === t ) !== undefined;
        });
    }
}
