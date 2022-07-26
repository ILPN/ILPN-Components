import {IncrementingCounter} from './incrementing-counter';

export class Relabeler {

    private readonly _existingLabels: Set<string>;
    private readonly _labelCounter: IncrementingCounter;
    private readonly _labelMapping: Map<string, string>;
    private readonly _labelOrder: Map<string, Array<string>>;

    private readonly _labelOrderIndex: Map<string, number>;

    private _locked = false;

    constructor() {
        this._existingLabels = new Set<string>();
        this._labelCounter = new IncrementingCounter();
        this._labelMapping = new Map<string, string>();
        this._labelOrder = new Map<string, Array<string>>();

        this._labelOrderIndex = new Map<string, number>();
    }

    public getNewLabel(oldLabel: string): string {
        if (!this._existingLabels.has(oldLabel)) {
            // label encountered for the first time
            this._existingLabels.add(oldLabel);
            this._labelMapping.set(oldLabel, oldLabel);
            this._labelOrder.set(oldLabel, [oldLabel]);
            this._labelOrderIndex.set(oldLabel, 1);
            return oldLabel;
        } else {
            // relabeling required
            let newLabelIndex = this._labelOrderIndex.get(oldLabel);
            if (newLabelIndex === undefined) {
                newLabelIndex = 0;
            }

            let relabelingOrder = this._labelOrder.get(oldLabel);
            if (relabelingOrder === undefined) {
                // relabeling collision
                relabelingOrder = [];
                this._labelOrder.set(oldLabel, relabelingOrder);
                newLabelIndex = 0;
            }

            if (newLabelIndex >= relabelingOrder.length) {
                // new label must be generated
                if (this._locked) {
                    throw new Error('Ran out of label options! Relabeler instance is locked and cannot generate new labels!');
                }
                let newLabel: string;
                do {
                    newLabel = `${oldLabel}${this._labelCounter.next()}`;
                } while (this._existingLabels.has(newLabel));
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

    public lock() {
        this._locked = true;
    }

}
