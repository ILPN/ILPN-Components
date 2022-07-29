export abstract class AbstractParser<T> {

    public static readonly TYPE_BLOCK = '.type';

    protected readonly _allowedTypes: Array<string>;

    protected constructor(allowedTypes: Array<string> | string) {
        this._allowedTypes = Array.isArray(allowedTypes) ? allowedTypes : [allowedTypes];
    }

    public parse(text: string): T | undefined {
        const lines = text.split('\n');
        if (!lines[0].startsWith(AbstractParser.TYPE_BLOCK)) {
            console.debug('file does not specify type in first line');
            return;
        }
        if (!this._allowedTypes.includes(lines[0].trimEnd().slice(AbstractParser.TYPE_BLOCK.length + 1))) {
            console.debug('bad file type')
            return;
        }

        lines.shift();
        return this.processFileLines(lines);
    };

    protected abstract processFileLines(lines: Array<string>): T | undefined;
}
