import {IncrementingCounter} from '../../../../utility/incrementing-counter';


export class PossibleMapping {

    public transitionId: string;
    private readonly _currentChoice: IncrementingCounter;
    private readonly _maximum: number;

    constructor(transitionId: string, maximum: number) {
        this.transitionId = transitionId;
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
