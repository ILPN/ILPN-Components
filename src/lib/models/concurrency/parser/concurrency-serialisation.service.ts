import {Injectable} from '@angular/core';
import {ConcurrencyRelation} from '../model/concurrency-relation';
import {AbstractParser} from '../../../utility/abstract-parser';
import {Relabeler} from '../../../utility/relabeler';
import {ConcurrencyMatrix} from '../model/concurrency-matrix';
import {unique} from 'ng-packagr/lib/utils/array';

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

        this.iterateConcurrentEntries(matrices.unique, (labelA, labelB) => {
            const originalA = this.getOriginalLabel(labelA, cachedUniqueLabels, relabeler);
            const originalB = this.getOriginalLabel(labelB, cachedUniqueLabels, relabeler);

            result += this.formatConcurrencyEntry(this.formatUniqueLabel(originalA), this.formatUniqueLabel(originalB));
        });

        this.iterateConcurrentEntries(matrices.wildcard, (labelA, labelB) => {
            // TODO unmapping of wildcard labels might be needed
            result += this.formatConcurrencyEntry(labelA, labelB);
        });

        this.iterateConcurrentEntries(matrices.mixed, (wildcardLabel, uniqueLabel) => {
            // TODO unmapping of wildcard labels might be needed
            const uniqueOriginal = this.getOriginalLabel(uniqueLabel, cachedUniqueLabels, relabeler);

            result += this.formatConcurrencyEntry(wildcardLabel, this.formatUniqueLabel(uniqueOriginal));
        });

        return result;
    }

    protected iterateConcurrentEntries(matrix: ConcurrencyMatrix, consumer: (a: string, b: string) => void) {
        for (const labelA of Object.keys(matrix)) {
            for (const labelB of Object.keys(matrix[labelA])) {
                if (!matrix[labelA][labelB]) {
                    continue;
                }
                consumer(labelA, labelB);
            }
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

    protected formatConcurrencyEntry(formattedLabelA: string, formattedLabelB: string): string {
        return `${formattedLabelA}${ConcurrencySerialisationService.PARALLEL_SYMBOL}${formattedLabelB}\n`;
    }

    protected formatUniqueLabel(label: OrderedOriginal): string {
        return `${label.original}[${label.order + 1}]`;
    }
}
