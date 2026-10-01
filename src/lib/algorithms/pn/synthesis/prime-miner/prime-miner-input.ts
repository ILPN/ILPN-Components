import {PartialOrder} from "../../../../models/po/model/partial-order";

export class PrimeMinerInput {

    /**
     * @param partialOrder a partial order
     * @param lastIterationChangedModel controls if a new round of region-based synthesis must be performed
     */
    constructor(public partialOrder: PartialOrder, public lastIterationChangedModel: boolean) {
    }
}
