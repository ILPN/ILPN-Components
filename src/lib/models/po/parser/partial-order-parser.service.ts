import {Injectable} from '@angular/core';
import {PartialOrder} from '../model/partial-order';
import {AbstractParser} from '../../../utility/abstract-parser';
import {BlockType} from './block-type';
import {Event} from '../model/event';

@Injectable({
    providedIn: 'root'
})
export class PartialOrderParserService extends AbstractParser<PartialOrder> {

    constructor() {
        super(
            ['run', 'po', 'ps'],
            [BlockType.EVENTS, BlockType.ARCS]
        );
    }

    override parse(text: string): PartialOrder | undefined {
        const po = super.parse(text);
        if (po !== undefined) {
            po.determineInitialEvents();
        }
        return po;
    }

    protected newResult(): PartialOrder {
        return new PartialOrder();
    }

    protected resolveBlockParser(block: string): ((lines: Array<string>, result: PartialOrder) => void) | undefined {
        switch (block) {
            case BlockType.EVENTS:
                return (lines, result) => this.parseEvents(lines, result);
            case BlockType.ARCS:
                return (lines, result) => this.parseEvents(lines, result);
            default:
                return undefined;
        }
    }

    private parseEvents(lines: Array<string>, partialOrder: PartialOrder) {
        this.parseEachLine(lines, (parts, line) => {
            if (parts.length !== 2) {
                throw new Error(`line ${line} does not have the correct number of elements! Event definitions must consist of exactly two elements!`);
            }
            partialOrder.addEvent(new Event(parts[0], parts[1]));
        });
    }

    private parseArcs(lines: Array<string>, partialOrder: PartialOrder) {
        this.parseEachLine(lines, (parts, line) => {
            if (parts.length !== 2) {
                throw new Error(`line ${line} does not have the correct number of elements! Arc definitions must consist of exactly two elements!`);
            }
            if (parts[0] === parts[1]) {
                throw new Error(`line ${line} specifies a reflexive arc! Partial order must be ireflexive!`);
            }
            const first = partialOrder.getEvent(parts[0]);
            const second = partialOrder.getEvent(parts[1]);
            if (first === undefined || second === undefined) {
                throw new Error(`line ${line} specifies an arc between at least one event that does not exist in the partial order!`);
            }
            first.nextEvents.add(second);
            second.previousEvents.add(first);
        });
    }

}
