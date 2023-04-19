export class StreamFilterState {

    private _currentIteration = 0;

    constructor(private readonly _MAX_ITERATIONS: number, initialOffset: number = 0) {
        this.reset(initialOffset);
    }

    public filter(): boolean {
        if (this._currentIteration > 0) {
            this._currentIteration--;
            return true;
        }
        return false;
    }

    public reset(offset = 0) {
        this._currentIteration = this._MAX_ITERATIONS - offset;
    }

    public currentIteration(): number {
        return this._MAX_ITERATIONS - this._currentIteration - 1;
    }
}
