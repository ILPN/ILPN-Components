import {MessageLevel} from '../../../models/glpk/glpk-constants';


export interface SolverConfiguration {
    messageLevel?: MessageLevel;
    logEquations?: boolean;
}
