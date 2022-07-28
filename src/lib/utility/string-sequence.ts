export interface StringSequence {
    get(i: number): string;
    length(): number;
}

export interface EditableStringSequence extends StringSequence {
    set(i: number, value: string): void;
}
