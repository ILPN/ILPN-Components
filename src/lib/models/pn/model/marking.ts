export class Marking {
    private readonly _marking: { [placeId: string]: number };

    constructor(marking: { [p: string]: number } | Marking) {
        this._marking = Object.assign({}, marking instanceof Marking ? marking._marking : marking);
    }

    public get(placeId: string): number | undefined {
        return this._marking[placeId];
    }

    public set(placeId: string, tokens: number) {
        this._marking[placeId] = tokens;
    }

    public equals(marking: Marking): boolean {
        const [myKeys, otherKeys] = this.getComparisonKeys(marking);

        if (myKeys.length !== otherKeys.size) {
            return false;
        }

        for (const key of myKeys) {
            if (this.get(key) !== marking.get(key)) {
                return false;
            }
            otherKeys.delete(key);
        }

        return otherKeys.size === 0;
    }

    public isGreaterThan(marking: Marking): boolean {
        const [myKeys, otherKeys] = this.getComparisonKeys(marking);

        if (myKeys.length !== otherKeys.size) {
            return false;
        }

        let isGreater = false;
        for (const key of myKeys) {
            const thisM = this.get(key);
            const otherM = marking.get(key);
            if (thisM === undefined || otherM === undefined) {
                return false;
            }
            if (thisM < otherM) {
                return false;
            } else if (thisM > otherM) {
                isGreater = true;
            }
            otherKeys.delete(key);
        }

        return otherKeys.size === 0 && isGreater;
    }

    public introduceOmegas(smallerMarking: Marking): void {
        if (!this.isGreaterThan(smallerMarking)) {
            return;
        }
        const myKeys = Object.keys(this._marking);
        for (const key of myKeys) {
            if (this.get(key)! > smallerMarking.get(key)!) {
                this.set(key, Number.POSITIVE_INFINITY);
            }
        }
    }

    public getKeys(): Array<string> {
        return Object.keys(this._marking);
    }

    private getComparisonKeys(marking: Marking): [Array<string>, Set<string>] {
        const myKeys = this.getKeys();
        const otherKeys = new Set(marking.getKeys());
        return [myKeys, otherKeys];
    }
}
