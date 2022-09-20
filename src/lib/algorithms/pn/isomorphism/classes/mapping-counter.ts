export class MappingCounter {

    public mappedId: string;
    private _currentChoice: number;
    private readonly _maximum: number;

    constructor(mappedId: string, maximum: number) {
        this.mappedId = mappedId;
        this._maximum = maximum;
        this._currentChoice = 0;
    }

    public current(): number {
        return this._currentChoice;
    }

    public next(): number {
        this._currentChoice += 1;
        if (this._currentChoice > this._maximum) {
            this._currentChoice = 0;
        }
        return this._currentChoice;
    }

    public isLastOption(): boolean {
        return this._currentChoice === this._maximum;
    }
}
