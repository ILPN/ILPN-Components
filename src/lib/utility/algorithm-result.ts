import {AbstractParser} from './abstract-parser';

export class AlgorithmResult {

    public static readonly RESULT_TYPE = 'result';
    public static readonly RUNTIME_BLOCK = '.runtime';
    public static readonly OUTPUT_BLOCK = '.output';

    private readonly _algorithmName: string;
    private readonly _runtimeMs: number;
    private readonly _output: Array<string>;

    constructor(algorithmName: string, startTimeMs: number, endTimeMs: number) {
        this._algorithmName = algorithmName;
        this._runtimeMs = endTimeMs - startTimeMs;
        this._output = [];
    }

    public addOutputLine(outputLine: string) {
        this._output.push(outputLine);
    }

    public serialise(): string {
        let result = `${AbstractParser.TYPE_BLOCK} ${AlgorithmResult.RESULT_TYPE}
${this._algorithmName}
${AlgorithmResult.RUNTIME_BLOCK}
${this._runtimeMs.toFixed(3)} ms
${AlgorithmResult.OUTPUT_BLOCK}`;

        this._output.forEach(line => {
            result = result.concat(`\n${line}`);
        });

        return result;
    }
}
