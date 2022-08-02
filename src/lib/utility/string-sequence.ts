export interface StringSequence {
    get(i: number): string;
    length(): number;
}

export interface EditableStringSequence extends StringSequence {
    set(i: number, value: string): void;
}

export interface EditableString {
    setString(value: string): void;
    getString(): string;
}

export class EditableStringSequenceWrapper implements EditableStringSequence {

    private readonly _array: Array<EditableString>;

    constructor(array: Array<EditableString>) {
        this._array = array;
    }

    get(i: number): string {
        return this._array[i].getString();
    }

    length(): number {
        return this._array.length;
    }

    set(i: number, value: string): void {
        this._array[i].setString(value);
    }
}
