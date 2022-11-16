import {OnDestroy} from '@angular/core';
import {ReplaySubject} from 'rxjs';
import {GLPK} from 'glpk.js';


export abstract class IlpSolverService implements OnDestroy {

    protected readonly _solver$: ReplaySubject<GLPK>;

    protected constructor() {
        this._solver$ = new ReplaySubject<GLPK>(1);

        // get the solver object
        const promise = import('glpk.js');
        promise.then(result => {
            // @ts-ignore
            result.default().then(glpk => {
                this._solver$.next(glpk);
            });
        });
    }

    ngOnDestroy(): void {
        this._solver$.complete();
    }
}
