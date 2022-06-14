import {AbstractParser} from './abstract-parser';
import {DropFile} from './drop-file';

export class AlgorithmResult {

    public static readonly RESULT_TYPE = 'result';
    public static readonly RUNTIME_BLOCK = '.runtime';
    public static readonly OUTPUT_BLOCK = '.output';

    private readonly _algorithmName: string;
    private readonly _runtimeMs: number | undefined;
    private readonly _output: Array<string>;

    constructor(algorithmName: string, startTimeMs?: number, endTimeMs?: number) {
        this._algorithmName = algorithmName;
        if (startTimeMs !== undefined && endTimeMs !== undefined) {
            this._runtimeMs = endTimeMs - startTimeMs;
        }
        this._output = [];
    }

    public addOutputLine(outputLine: string) {
        this._output.push(outputLine);
    }

    public serialise(): string {
        let result = `${AbstractParser.TYPE_BLOCK} ${AlgorithmResult.RESULT_TYPE}
${this._algorithmName}`;

        if (this._runtimeMs !== undefined) {
            result = result.concat(`
${AlgorithmResult.RUNTIME_BLOCK}
${this._runtimeMs.toFixed(3)} ms`
            );
        }

        result = result.concat(`\n${AlgorithmResult.OUTPUT_BLOCK}`);

        this._output.forEach(line => {
            result = result.concat(`\n${line}`);
        });

        return result;
    }

    public toDropFile(fileName: string, suffix?: string): DropFile {
        return new DropFile(fileName, this.serialise(), suffix);
    }
}
