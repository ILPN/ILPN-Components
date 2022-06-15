export class ValidationResult {
    public valid: boolean;
    public phase: ValidationPhase;

    constructor(valid: boolean, phase: ValidationPhase) {
        this.valid = valid;
        this.phase = phase;
    }
}

export enum ValidationPhase {
    FLOW = 'flow',
    FORWARDS = 'forwards',
    BACKWARDS = 'backwards'
}
