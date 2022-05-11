import {Variable} from './variable';
import {Bound} from './bound';

export type SubjectTo = {
    name: string,
    vars: Array<Variable>
    bnds: Bound
};
