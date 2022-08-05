import {Injectable} from '@angular/core';
import {ConcurrencyRelation} from '../model/concurrency-relation';
import {AbstractParser} from '../../../utility/abstract-parser';
import {Relabeler} from '../../../utility/relabeler';


interface RelabelingResult {
    isWildcard?: boolean;
    label: string;
}


@Injectable({
    providedIn: 'root'
})
export class ConcurrencyParserService extends AbstractParser<ConcurrencyRelation> {

    protected static LINE_REGEX = /^(.+?)(?:\[([1-9]\d*)\])?(?:\|\||∥)(.+?)(?:\[([1-9]\d*)\])?(?: #\d+ \d+)?$/;

    constructor() {
        super('concurrency');
    }

    protected processFileLines(lines: Array<string>): ConcurrencyRelation | undefined {
        const result = ConcurrencyRelation.noConcurrency();
        const relabeler = result.relabeler;

        for (const line of lines) {
            if (line.trimEnd().length === 0) {
                continue;
            }

            const match = line.match(ConcurrencyParserService.LINE_REGEX);
            if (match === null) {
                console.debug(line);
                console.debug('line could not be matched with regex');
                continue;
            }

            const eventA = this.getUniqueLabel(match[1], parseInt(match[2]), relabeler);
            const eventB = this.getUniqueLabel(match[3], parseInt(match[4]), relabeler);

            if (!eventA.isWildcard && !eventB.isWildcard) {
                result.setUniqueConcurrent(eventA.label, eventB.label);
            } else if (eventA.isWildcard && eventB.isWildcard) {
                result.setWildcardConcurrent(eventA.label, eventB.label);
            } else if (eventA.isWildcard && !eventB.isWildcard) {
                result.setMixedConcurrent(eventA.label, eventB.label);
            } else {
                result.setMixedConcurrent(eventB.label, eventA.label);
            }
        }

        relabeler.restartSequence();
        return result;
    }

    protected getUniqueLabel(label: string, oneBasedOrder: number, relabeler: Relabeler): RelabelingResult {
        if (isNaN(oneBasedOrder)) {
            return {
                isWildcard: true,
                label
            };
        }

        const storedOrder = relabeler.getLabelOrder().get(label);
        const storedLabel = storedOrder?.[oneBasedOrder - 1];
        if (storedLabel !== undefined) {
            return {
                label: storedLabel
            };
        }

        let missingCount;
        if (storedOrder === undefined) {
            missingCount = oneBasedOrder;
        } else {
            missingCount = oneBasedOrder - storedOrder.length;
        }

        let missingLabel: string;
        for (let i = 0; i < missingCount; i++) {
            missingLabel = relabeler.getNewUniqueLabel(label);
        }

        return {
            label: missingLabel!
        };
    }
}
