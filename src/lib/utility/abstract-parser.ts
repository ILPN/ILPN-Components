export abstract class AbstractParser<T> {

    public static readonly TYPE_BLOCK = '.type';

    protected readonly _allowedTypes: Array<string>;
    protected readonly _supportedBlocks: Array<string>;

    protected constructor(allowedTypes: Array<string> | string, supportedBlocks: Array<string>) {
        this._allowedTypes = Array.isArray(allowedTypes) ? allowedTypes : [allowedTypes];
        this._supportedBlocks = supportedBlocks;
    }

    parse(text: string): T | undefined {
        const lines = text.split('\n');
        if (!lines[0].startsWith(AbstractParser.TYPE_BLOCK)) {
            console.debug('file does not specify type in first line');
            return;
        }
        if (this._allowedTypes.includes(lines[0].trimEnd().slice(AbstractParser.TYPE_BLOCK.length + 1))) {
            console.debug('bad file type')
            return;
        }

        const result = this.newResult();

        let currentBlock: string | undefined = undefined;
        let blockStart = -1;

        try {
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trimEnd();
                if (!line.startsWith('.')) {
                    continue;
                }

                const newBlock = this._supportedBlocks.find(block => line.startsWith(block));
                if (newBlock === undefined) {
                    console.debug(`ignoring unsupported block on line ${i}: '${line}'`);
                    continue;
                }

                if (currentBlock !== undefined) {
                    const blockParser = this.resolveBlockParser(currentBlock);
                    if (blockParser === undefined) {
                        throw new Error(`block type '${newBlock}' is suppoerted but no block parser could be resolved!`);
                    }
                    blockParser(lines.slice(blockStart, i), result);
                }

                blockStart = i + 1;
                currentBlock = newBlock;
            }
        } catch (e) {
            console.error((e as Error).message);
            return undefined;
        }

        return result;
    }

    protected abstract newResult(): T;

    protected abstract resolveBlockParser(block: string): undefined | ((lines: Array<string>, result: T) => void);

    protected parseEachLine(lines: Array<string>, partParser: (parts: Array<string>, line: string) => void) {
        for (let i = 0; i < lines.length; i++) {
            const line = this.getLineTrimEnd(lines, i);
            if (line.length === 0) {
                continue;
            }
            const parts = line.split(' ');
            partParser(parts, line);
        }
    }

    protected getLineTrimEnd(lines: Array<string>, index: number): string {
        return lines[index].trimEnd();
    }
}
