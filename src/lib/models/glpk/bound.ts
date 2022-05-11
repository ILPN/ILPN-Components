import {Constraint} from './glpk-constants';

export type Bound = {
    type: Constraint,
    ub: number,
    lb: number
};
