import {Injectable} from '@angular/core';
import {ConcurrencyRelation} from '../model/concurrency-relation';
import {AbstractParser} from '../../../utility/parsing/abstract-parser';
import {Relabeler} from '../../../utility/relabeler';
import {ConcurrencyMatrix} from '../model/concurrency-matrix';


interface OrderedOriginal {
    original: string,
    order: number
}

@Injectable({
    providedIn: 'root'
})
export class ConcurrencySerialisationService {

    private static PARALLEL_SYMBOL = '∥';

    constructor() {
    }

    public serialise(concurrency: ConcurrencyRelation): string {
        let result = `${AbstractParser.TYPE_BLOCK} concurrency\n`

        const relabeler = concurrency.relabeler;
        const cachedUniqueLabels = new Map<string, OrderedOriginal>();
        const matrices = concurrency.cloneConcurrencyMatrices();

        this.iterateConcurrentEntries(matrices.unique, true, (labelA, labelB, fab, fba) => {
            const originalA = this.getOriginalLabel(labelA, cachedUniqueLabels, relabeler);
            const originalB = this.getOriginalLabel(labelB, cachedUniqueLabels, relabeler);

            result += this.formatConcurrencyEntry(this.formatUniqueLabel(originalA), this.formatUniqueLabel(originalB), fab!, fba!);
        });

        this.iterateConcurrentEntries(matrices.wildcard, true, (labelA, labelB, fab, fba) => {
            // TODO unmapping of wildcard labels might be needed
            result += this.formatConcurrencyEntry(labelA, labelB, fab!, fba!);
        });

        this.iterateConcurrentEntries(matrices.mixed, false, (wildcardLabel, uniqueLabel) => {
            // TODO unmapping of wildcard labels might be needed
            const uniqueOriginal = this.getOriginalLabel(uniqueLabel, cachedUniqueLabels, relabeler);

            result += this.formatConcurrencyEntry(wildcardLabel, this.formatUniqueLabel(uniqueOriginal));
        });

        return result;
    }

    protected iterateConcurrentEntries(matrix: ConcurrencyMatrix, symmetric: boolean, consumer: (a: string, b: string, fab?: number, fba?: number) => void) {
        if (!symmetric) {
            for (const labelA of Object.keys(matrix)) {
                for (const labelB of Object.keys(matrix[labelA])) {
                    this.processMatrixEntry(matrix, labelA, labelB, consumer);
                }
            }
        } else {
            const keys = Object.keys(matrix);
            for (let i = 0; i < keys.length; i++) {
                const labelA = keys[i];
                for (let j = i + 1; j < keys.length; j++) {
                    const labelB = keys[j];
                    this.processMatrixEntry(matrix, labelA, labelB, consumer);
                }
            }
        }
    }

    protected processMatrixEntry(matrix: ConcurrencyMatrix, labelA: string, labelB: string, consumer: (a: string, b: string, fab?: number, fba?: number) => void) {
        if (!matrix[labelA][labelB]) {
            return;
        }
        if (typeof matrix[labelA][labelB] === 'boolean') {
            consumer(labelA, labelB);
        } else {
            consumer(labelA, labelB, matrix[labelA][labelB] as number, matrix[labelB][labelA] as number);
        }
    }

    protected getOriginalLabel(label: string, cachedUniqueLabels: Map<string, OrderedOriginal>, relabeler: Relabeler): OrderedOriginal {
        const m = cachedUniqueLabels.get(label);
        if (m !== undefined) {
            return m;
        }
        const original = relabeler.getLabelMapping().get(label);
        if (original === undefined) {
            console.debug(relabeler);
            console.debug(label);
            throw new Error('Unique concurrency matrix contains an entry unknown to the relabeling function!');
        }
        const order = relabeler.getLabelOrder().get(original)!.findIndex(l => l === label);
        if (order === -1) {
            console.debug(relabeler);
            console.debug(label);
            throw new Error('Unique concurrency matrix contains an entry outside of the relabeling order of the relabeling function!');
        }
        cachedUniqueLabels.set(label, {original, order});
        return cachedUniqueLabels.get(label)!;
    }

    protected formatConcurrencyEntry(formattedLabelA: string, formattedLabelB: string): string;
    protected formatConcurrencyEntry(formattedLabelA: string, formattedLabelB: string, frequencyAB: number, frequencyBA: number): string
    protected formatConcurrencyEntry(formattedLabelA: string, formattedLabelB: string, frequencyAB?: number, frequencyBA?: number): string {
        if (frequencyAB === undefined && frequencyBA === undefined) {
            return `${formattedLabelA}${ConcurrencySerialisationService.PARALLEL_SYMBOL}${formattedLabelB}\n`;
        } else {
            return `${formattedLabelA}${ConcurrencySerialisationService.PARALLEL_SYMBOL}${formattedLabelB} #${frequencyAB} ${frequencyBA}\n`;
        }
    }

    protected formatUniqueLabel(label: OrderedOriginal): string {
        return `${label.original}[${label.order + 1}]`;
    }
}
