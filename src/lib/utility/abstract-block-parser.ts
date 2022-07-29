import {AbstractParser} from './abstract-parser';

export abstract class AbstractBlockParser<T> extends AbstractParser<T> {

    protected readonly _supportedBlocks: Array<string>;

    protected constructor(allowedTypes: Array<string> | string, supportedBlocks: Array<string>) {
        super(allowedTypes);
        this._supportedBlocks = supportedBlocks;
    }

    protected override processFileLines(lines: Array<string>): T | undefined {
        const result = this.newResult();

        let currentBlock: string | undefined = undefined;
        let blockStart = -1;

        try {
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trimEnd();
                if (!line.startsWith('.')) {
                    continue;
                }

                const newBlock = this._supportedBlocks.find(block => line.startsWith(block));
                if (newBlock === undefined) {
                    console.debug(`ignoring unsupported block on line ${i}: '${line}'`);
                    continue;
                }

                this.parseBlock(currentBlock, blockStart, i, lines, result);

                blockStart = i + 1;
                currentBlock = newBlock;
            }
            this.parseBlock(currentBlock, blockStart, lines.length, lines, result);
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

    private parseBlock(currentBlock: string | undefined, blockStart: number, blockEnd: number, lines: Array<string>, result: T) {
        if (currentBlock !== undefined) {
            const blockParser = this.resolveBlockParser(currentBlock);
            if (blockParser === undefined) {
                throw new Error(`block type '${currentBlock}' is suppoerted but no block parser could be resolved!`);
            }
            blockParser(lines.slice(blockStart, blockEnd), result);
        }
    }
}
