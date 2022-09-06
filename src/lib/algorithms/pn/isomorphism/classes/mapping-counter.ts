import {IncrementingCounter} from '../../../../utility/incrementing-counter';


export class MappingCounter {

    public mappedId: string;
    private readonly _currentChoice: IncrementingCounter;
    private readonly _maximum: number;

    constructor(mappedId: string, maximum: number) {
        this.mappedId = mappedId;
        this._maximum = maximum;
        this._currentChoice = new IncrementingCounter();
    }

    public current(): number {
        return this._currentChoice.current();
    }

    public next(): number {
        const next = this._currentChoice.next();
        if (next === this._maximum) {
            this._currentChoice.reset();
            return 0;
        }
        return next;
    }

    public isLastOption(): boolean {
        return this._currentChoice.current() + 1 === this._maximum;
    }
}
