import {MapSet} from '../../../../utility/map-set';
import {MappingCounter} from './mapping-counter';

export class MappingManager {

    private readonly _mappingCounters: Array<MappingCounter>;
    private readonly _mappingOrder: Map<string, Array<string>>;

    constructor(possibleMappings: MapSet<string, string>) {
        this._mappingCounters = [];
        for (const [id, mappableIds] of possibleMappings.entries()) {
            this._mappingCounters.push(new MappingCounter(id, mappableIds.size - 1))
        }

        this._mappingOrder = new Map<string, Array<string>>(this._mappingCounters.map(choice => [choice.mappedId, Array.from(possibleMappings.get(choice.mappedId))]));
    }

    public getCurrentMapping(): Map<string, string> {
        return new Map<string, string>(this._mappingCounters.map(choice => [choice.mappedId, this._mappingOrder.get(choice.mappedId)![choice.current()]]));
    }

    /**
     * Increments the current mapping to the next possibility.
     *
     * @returns `true` if the final mapping was passed. `false` otherwise.
     */
    public moveToNextMapping(): boolean {
        let incrementedIndex = 0;
        while (incrementedIndex < this._mappingCounters.length) {
            const carry = this._mappingCounters[incrementedIndex].isLastOption();
            this._mappingCounters[incrementedIndex].next();
            if (carry) {
                incrementedIndex++;
            } else {
                break;
            }
        }
        return incrementedIndex === this._mappingCounters.length;
    }
}
