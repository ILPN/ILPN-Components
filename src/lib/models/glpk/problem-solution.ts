import {LP, Result} from 'glpk.js';

export interface ProblemSolution {
    ilp: LP;
    solution: Result;
}
