import {Injectable} from '@angular/core';
import {ConcurrencyRelation} from '../model/concurrency-relation';
import {AbstractParser} from '../../../utility/abstract-parser';
import {Relabeler} from '../../../utility/relabeler';

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
        const labelMap = new Map<string, OrderedOriginal>();
        const uniqueLabels = Array.from(relabeler.getLabelMapping().keys());
        for (let i = 0; i < uniqueLabels.length; i++) {
            const labelA = uniqueLabels[i];
            for (let j = i + 1; j < uniqueLabels.length; j++) {
                const labelB = uniqueLabels[j];

                if (!concurrency.isConcurrent(labelA, labelB)) {
                    continue;
                }

                const originalA = this.getOriginalLabel(labelA, labelMap, relabeler);
                const originalB = this.getOriginalLabel(labelB, labelMap, relabeler);

                result += `${this.formatLabel(originalA)}${ConcurrencySerialisationService.PARALLEL_SYMBOL}${this.formatLabel(originalB)}\n`;

            }
        }

        return result;
    }

    private getOriginalLabel(label: string, labelMap: Map<string, OrderedOriginal>, relabeler: Relabeler): OrderedOriginal {
        const m = labelMap.get(label);
        if (m !== undefined) {
            return m;
        }
        const original = relabeler.getLabelMapping().get(label);
        if (original === undefined) {
            // TODO wildcard?
            throw new Error();
        }
        const order = relabeler.getLabelOrder().get(original)!.findIndex(l => l === label);
        if (order === -1) {
            // TODO
            throw new Error();
        }
        labelMap.set(label, {original, order});
        return labelMap.get(label)!;
    }

    private formatLabel(label: OrderedOriginal): string {
        return `${label.original}[${label.order + 1}]`;
    }
}
