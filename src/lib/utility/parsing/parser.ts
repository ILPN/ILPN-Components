export interface Parser<T> {
    parse(text: string): T | undefined;
}
