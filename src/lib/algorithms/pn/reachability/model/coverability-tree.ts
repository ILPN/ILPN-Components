import {Marking} from '../../../../models/pn/model/marking';

export class CoverabilityTree {
    private readonly _omegaMarking: Marking;
    private readonly _ancestors: Array<CoverabilityTree>;
    private readonly _children: Map<string, CoverabilityTree>;

    constructor(omegaMarking: Marking, ancestors: Array<CoverabilityTree> = []) {
        this._omegaMarking = omegaMarking;
        this._ancestors = ancestors;
        this._children = new Map<string, CoverabilityTree>();
    }

    get omegaMarking(): Marking {
        return this._omegaMarking;
    }

    get ancestors(): Array<CoverabilityTree> {
        return this._ancestors;
    }

    public getChildren(): Array<CoverabilityTree> {
        return Array.from(this._children.values());
    }

    public getChildrenMap(): Map<string, CoverabilityTree> {
        return new Map<string, CoverabilityTree>(this._children);
    }

    public addChild(label: string, marking: Marking): CoverabilityTree {
        const child = new CoverabilityTree(marking, [...this._ancestors, this]);
        this._children.set(label, child);
        return child;
    }
}
