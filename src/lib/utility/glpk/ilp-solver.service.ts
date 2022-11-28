import {Injectable, OnDestroy} from '@angular/core';
import {ReplaySubject} from 'rxjs';
import {GLPK} from 'glpk.js';
import {getSolverSubject} from './web-worker-glpk-wrapper';


@Injectable()
export abstract class IlpSolverService implements OnDestroy {

    protected _solver$: ReplaySubject<GLPK> | undefined;

    protected constructor() {
        getSolverSubject(solver$ => {
            this._solver$ = solver$;
        });
    }

    ngOnDestroy(): void {
        this._solver$?.complete();
    }
}
