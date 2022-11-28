import {ReplaySubject} from 'rxjs';
import {GLPK} from 'glpk.js';


export function getSolverSubject(consumer: (solver$: ReplaySubject<GLPK>) => void ) {
    const solver$ = new ReplaySubject<GLPK>(1);

    // get the solver object
    const promise = import('glpk.js');
    promise.then(result => {
        // @ts-ignore
        result.default().then(glpk => {
            solver$.next(glpk);
        });
    });

    consumer(solver$);
}
