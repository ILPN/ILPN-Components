export abstract class Valid {

    protected constructor(public valid: boolean, public placeId: string) {
    }
}

export class ValidationResult extends Valid {

    constructor(valid: boolean, placeId: string, public phase: ValidationPhase) {
        super(valid, placeId);
    }
}

export enum ValidationPhase {
    FLOW = 'flow',
    FORWARDS = 'forwards',
    BACKWARDS = 'backwards'
}

export class TokenTrailValidationResult extends Valid {

    constructor(valid: boolean, placeId: string) {
        super(valid, placeId);
    }
}
