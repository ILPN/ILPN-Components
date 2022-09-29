import {createUniqueString, IncrementingCounter} from './incrementing-counter';
import {EditableStringSequence} from './string-sequence';
import {iterate} from './iterate';

export class Relabeler {

    private readonly _existingLabels: Set<string>;
    private readonly _labelCounter: IncrementingCounter;
    private readonly _labelMapping: Map<string, string>;
    private readonly _labelOrder: Map<string, Array<string>>;
    private readonly _nonUniqueIdentities: Set<string>;

    private readonly _labelOrderIndex: Map<string, number>;

    constructor() {
        this._existingLabels = new Set<string>();
        this._labelCounter = new IncrementingCounter();
        this._labelMapping = new Map<string, string>();
        this._labelOrder = new Map<string, Array<string>>();
        this._nonUniqueIdentities = new Set<string>();

        this._labelOrderIndex = new Map<string, number>();
    }

    public clone(): Relabeler {
        const result = new Relabeler();
        this._existingLabels.forEach(l => {
            result._existingLabels.add(l);
        });
        result._labelCounter.setCurrentValue(this._labelCounter.current());
        this._labelMapping.forEach((v, k) => {
            result._labelMapping.set(k, v);
        });
        this._labelOrder.forEach((v, k) => {
            result._labelOrder.set(k, [...v]);
        });
        this._nonUniqueIdentities.forEach(nui => {
            result._nonUniqueIdentities.add(nui);
        })
        return result;
    }

    public getNewUniqueLabel(oldLabel: string): string {
        return this.getNewLabel(oldLabel, false);
    }

    public getNewLabelPreserveNonUniqueIdentities(oldLabel: string): string {
        return this.getNewLabel(oldLabel, true);
    }

    protected getNewLabel(oldLabel: string, preserveNonUniqueIdentities: boolean): string {
        if (!this._existingLabels.has(oldLabel)) {
            // label encountered for the first time
            this._existingLabels.add(oldLabel);
            this._labelMapping.set(oldLabel, oldLabel);

            if (preserveNonUniqueIdentities) {
                this._nonUniqueIdentities.add(oldLabel);
            } else {
                this._labelOrder.set(oldLabel, [oldLabel]);
                this._labelOrderIndex.set(oldLabel, 1);
            }

            return oldLabel;
        } else {
            // relabeling required
            let newLabelIndex = this._labelOrderIndex.get(oldLabel);
            if (newLabelIndex === undefined) {
                newLabelIndex = 0;
            }

            let relabelingOrder = this._labelOrder.get(oldLabel);
            if (relabelingOrder === undefined) {
                // relabeling collision or non-unique identity
                if (preserveNonUniqueIdentities && this._nonUniqueIdentities.has(oldLabel)) {
                    return oldLabel;
                }
                relabelingOrder = [];
                this._labelOrder.set(oldLabel, relabelingOrder);
                newLabelIndex = 0;
            }

            if (newLabelIndex >= relabelingOrder.length) {
                // new label must be generated
                const newLabel = createUniqueString(oldLabel, this._existingLabels, this._labelCounter);
                this._existingLabels.add(newLabel);
                relabelingOrder.push(newLabel);
                this._labelMapping.set(newLabel, oldLabel);
            }

            this._labelOrderIndex.set(oldLabel, newLabelIndex + 1);
            return relabelingOrder[newLabelIndex];
        }
    }

    public restartSequence() {
        this._labelOrderIndex.clear();
    }

    public getLabelMapping(): Map<string, string> {
        return this._labelMapping;
    }

    public getLabelOrder(): Map<string, Array<string>> {
        return this._labelOrder;
    }

    public uniquelyRelabelSequence(sequence: EditableStringSequence) {
        this.relabel(sequence, false);
    }

    public uniquelyRelabelSequences(sequences: Iterable<EditableStringSequence>) {
        iterate(sequences, s => {
            this.uniquelyRelabelSequence(s);
        });
    }

    public relabelSequencePreserveNonUniqueIdentities(sequence: EditableStringSequence) {
        this.relabel(sequence, true);
    }

    public relabelSequencesPreserveNonUniqueIdentities(sequences: Iterable<EditableStringSequence>) {
        iterate(sequences, s => {
            this.relabelSequencePreserveNonUniqueIdentities(s);
        });
    }

    protected relabel(sequence: EditableStringSequence, preserveIdentities: boolean) {
        this.restartSequence();
        for (let i = 0; i < sequence.length(); i++) {
            sequence.set(i, this.getNewLabel(sequence.get(i), preserveIdentities));
        }
    }

    public undoSequenceLabeling(sequence: EditableStringSequence) {
        for (let i = 0; i < sequence.length(); i++) {
            sequence.set(i, this.undoLabel(sequence.get(i)));
        }
    }

    public undoSequencesLabeling(sequences: Iterable<EditableStringSequence>) {
        iterate(sequences, s => {
            this.undoSequenceLabeling(s);
        });
    }

    public undoLabel(label: string): string {
        return this._labelMapping.get(label) ?? label
    }
}
